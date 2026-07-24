import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { isUsingPreviewData } from "@/lib/auth/guards";

/**
 * Public published CMS content for marketing sites / apps.
 * Only returns published rows — never drafts.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ businessSlug: string; locale: string }> },
) {
  const { businessSlug, locale } = await context.params;

  if (isUsingPreviewData()) {
    return NextResponse.json({
      businessSlug,
      locale,
      pages: [
        {
          slug: "home",
          title: "Welcome",
          sections: [
            {
              section_type: "hero",
              sort_order: 0,
              content: {
                headline: "Preview published homepage",
                subheadline: "Connect Supabase for live CMS data.",
              },
            },
          ],
        },
      ],
      mode: "preview",
    });
  }

  try {
    const admin = createAdminClient();
    const { data: business } = await admin
      .from("businesses")
      .select("id, slug, status")
      .eq("slug", businessSlug)
      .eq("status", "ACTIVE")
      .maybeSingle();

    if (!business) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const { data: pages } = await admin
      .from("website_pages")
      .select("id, slug, title, seo_title, seo_description, published_at")
      .eq("business_id", business.id)
      .eq("status", "PUBLISHED")
      .order("slug");

    const pageIds = (pages ?? []).map((p) => p.id);
    const { data: sections } =
      pageIds.length > 0
        ? await admin
            .from("website_sections")
            .select("page_id, section_type, sort_order, content")
            .in("page_id", pageIds)
            .order("sort_order")
        : { data: [] as Array<{
            page_id: string;
            section_type: string;
            sort_order: number;
            content: Record<string, unknown>;
          }> };

    const sectionsByPage = new Map<string, typeof sections>();
    for (const section of sections ?? []) {
      const list = sectionsByPage.get(section.page_id) ?? [];
      list.push(section);
      sectionsByPage.set(section.page_id, list);
    }

    return NextResponse.json({
      businessSlug: business.slug,
      locale,
      pages: (pages ?? []).map((page) => ({
        slug: page.slug,
        title: page.title,
        seo: {
          title: page.seo_title,
          description: page.seo_description,
        },
        published_at: page.published_at,
        sections: (sectionsByPage.get(page.id) ?? []).map((s) => ({
          section_type: s.section_type,
          sort_order: s.sort_order,
          content: s.content,
        })),
      })),
      mode: "live",
    });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
