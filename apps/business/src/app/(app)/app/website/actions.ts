"use server";

import { revalidatePath } from "next/cache";
import {
  fail,
  liveSuccess,
  previewSuccess,
  usingPreview,
  type ActionMessage,
} from "@/lib/actions/result";
import { requireTenantContext } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { isMutatingRestricted } from "@/lib/billing/policy";

async function guardCmsWrite(): Promise<
  | { ok: true; businessId: string; userId: string }
  | { ok: false; message: ActionMessage }
> {
  const { actor, tenant } = await requireTenantContext();
  if (
    !tenant.permissions.has("website.edit") &&
    !tenant.permissions.has("website.publish")
  ) {
    return { ok: false, message: fail("You do not have permission to edit the website.") };
  }

  // Soft restriction check via business status when live
  if (!usingPreview()) {
    const supabase = await createClient();
    const { data: business } = await supabase
      .from("businesses")
      .select("status")
      .eq("id", tenant.businessId)
      .maybeSingle();
    if (business && isMutatingRestricted(business.status as never)) {
      return {
        ok: false,
        message: fail("Publishing is restricted while billing is past due. Contact KasiTech."),
      };
    }
  }

  return { ok: true, businessId: tenant.businessId, userId: actor.userId };
}

export async function saveWebsiteDraftAction(
  _prev: ActionMessage | null,
  formData: FormData,
): Promise<ActionMessage> {
  const limited = rateLimit({
    key: `cms:draft:${formData.get("businessHint") || "x"}`,
    limit: 30,
    windowMs: 60_000,
  });
  if (!limited.allowed) return fail("Too many saves. Try again shortly.");

  const headline = String(formData.get("headline") || "").trim();
  const subheadline = String(formData.get("subheadline") || "").trim();
  const cta = String(formData.get("cta") || "").trim();

  if (!headline) return fail("Headline is required.");

  if (usingPreview()) {
    return previewSuccess("Draft saved (preview). Public site unchanged until live publish.", {
      headline,
      subheadline,
      cta,
    });
  }

  const guard = await guardCmsWrite();
  if (!guard.ok) return guard.message;

  const supabase = await createClient();
  const businessId = guard.businessId;

  let { data: site } = await supabase
    .from("website_sites")
    .select("id")
    .eq("business_id", businessId)
    .maybeSingle();

  if (!site) {
    const { data: created, error } = await supabase
      .from("website_sites")
      .insert({ business_id: businessId, name: "Main site", status: "STAGING" })
      .select("id")
      .single();
    if (error || !created) return fail("Could not create website site.");
    site = created;
  }

  let { data: page } = await supabase
    .from("website_pages")
    .select("id, version")
    .eq("site_id", site.id)
    .eq("slug", "home")
    .maybeSingle();

  if (!page) {
    const { data: created, error } = await supabase
      .from("website_pages")
      .insert({
        business_id: businessId,
        site_id: site.id,
        title: "Home",
        slug: "home",
        status: "DRAFT",
        version: 1,
      })
      .select("id, version")
      .single();
    if (error || !created) return fail("Could not create home page.");
    page = created;
  } else {
    await supabase
      .from("website_pages")
      .update({ status: "DRAFT", updated_at: new Date().toISOString() })
      .eq("id", page.id);
  }

  const { data: existingHero } = await supabase
    .from("website_sections")
    .select("id")
    .eq("page_id", page.id)
    .eq("section_type", "hero")
    .maybeSingle();

  const content = { headline, subheadline, cta };

  if (existingHero) {
    await supabase
      .from("website_sections")
      .update({ content, updated_at: new Date().toISOString() })
      .eq("id", existingHero.id);
  } else {
    await supabase.from("website_sections").insert({
      business_id: businessId,
      page_id: page.id,
      section_type: "hero",
      sort_order: 0,
      content,
    });
  }

  revalidatePath("/app/website");
  revalidatePath("/app/website/editor");
  return liveSuccess("Draft saved. Public site still shows the last published version.");
}

export async function publishWebsiteAction(
  _prev: ActionMessage | null,
  formData: FormData,
): Promise<ActionMessage> {
  const limited = rateLimit({
    key: `cms:publish:${formData.get("businessHint") || "x"}`,
    limit: 10,
    windowMs: 60_000,
  });
  if (!limited.allowed) return fail("Too many publish attempts. Try again shortly.");

  const headline = String(formData.get("headline") || "").trim();
  const subheadline = String(formData.get("subheadline") || "").trim();
  const cta = String(formData.get("cta") || "").trim();
  if (!headline) return fail("Headline is required.");

  // Always save draft content first in preview
  if (usingPreview()) {
    return previewSuccess(
      "Published (preview). Version recorded locally. Connect Supabase for live public API updates.",
      { headline, subheadline, cta, status: "PUBLISHED" },
    );
  }

  const draft = await saveWebsiteDraftAction(null, formData);
  if (!draft.ok) return draft;

  const guard = await guardCmsWrite();
  if (!guard.ok) return guard.message;

  const supabase = await createClient();
  const businessId = guard.businessId;

  const { data: page } = await supabase
    .from("website_pages")
    .select("id, version, slug")
    .eq("business_id", businessId)
    .eq("slug", "home")
    .maybeSingle();

  if (!page) return fail("Home page missing — save a draft first.");

  const { data: sections } = await supabase
    .from("website_sections")
    .select("section_type, sort_order, content")
    .eq("page_id", page.id)
    .order("sort_order");

  const nextVersion = (page.version ?? 1) + 1;

  await supabase.from("website_versions").insert({
    business_id: businessId,
    page_id: page.id,
    version: nextVersion,
    snapshot: { sections: sections ?? [] },
    created_by: guard.userId,
  });

  await supabase
    .from("website_pages")
    .update({
      status: "PUBLISHED",
      version: nextVersion,
      published_at: new Date().toISOString(),
    })
    .eq("id", page.id);

  await supabase.from("website_publications").insert({
    business_id: businessId,
    page_id: page.id,
    published_by: guard.userId,
    status: "SUCCESS",
    revalidation_status: "SUCCESS",
  });

  await supabase.from("audit_logs").insert({
    business_id: businessId,
    actor_user_id: guard.userId,
    actor_type: "USER",
    action: "website.publish",
    resource_type: "website_page",
    resource_id: page.id,
    new_values: { version: nextVersion, slug: page.slug },
  });

  revalidatePath("/app/website");
  revalidatePath("/app/website/editor");
  return liveSuccess("Published. Public API will serve this version after cache refresh.");
}
