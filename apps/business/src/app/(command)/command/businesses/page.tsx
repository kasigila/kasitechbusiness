import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Button, EmptyState, PageHeader } from "@kasitech/ui";
import { requireCommandAccess, isUsingPreviewData } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { PREVIEW_BUSINESS } from "@/lib/preview";

export const metadata: Metadata = {
  title: "Businesses",
};

export default async function BusinessesPage() {
  await requireCommandAccess();

  let businesses: Array<{
    id: string;
    display_name: string;
    slug: string;
    status: string;
    primary_industry: string | null;
    created_at?: string;
  }> = [];

  if (isUsingPreviewData()) {
    businesses = [
      {
        id: PREVIEW_BUSINESS.id,
        display_name: PREVIEW_BUSINESS.display_name,
        slug: PREVIEW_BUSINESS.slug,
        status: PREVIEW_BUSINESS.status,
        primary_industry: PREVIEW_BUSINESS.primary_industry,
      },
      {
        id: "00000000-0000-4000-8000-000000000002",
        display_name: "Zuri Salon",
        slug: "zuri-salon",
        status: "ACTIVE",
        primary_industry: "beauty_wellness",
      },
    ];
  } else {
    const supabase = await createClient();
    const { data } = await supabase
      .from("businesses")
      .select("id, display_name, slug, status, primary_industry, created_at")
      .order("created_at", { ascending: false });
    businesses = data ?? [];
  }

  return (
    <div>
      <PageHeader
        title="Businesses"
        description="All KasiTech Business tenants."
        actions={
          <Link href="/command/businesses/new">
            <Button className="bg-[var(--kb-green)] text-[var(--kb-ink)]">
              + Create Business
            </Button>
          </Link>
        }
      />

      {!businesses.length ? (
        <EmptyState
          title="No businesses yet"
          description="Create the first tenant after commercial agreement and required payment conditions."
          action={
            <Link href="/command/businesses/new" className="kb-btn kb-btn-primary">
              Create Business
            </Link>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-white/10 text-white/60">
              <tr>
                <th className="px-4 py-3 font-medium">Business</th>
                <th className="px-4 py-3 font-medium">Industry</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {businesses.map((b) => (
                <tr key={b.id} className="border-b border-white/5">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{b.display_name}</div>
                    <div className="font-mono text-xs text-white/50">{b.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-white/80">
                    {b.primary_industry ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={b.status === "ACTIVE" ? "success" : "warning"}>
                      {b.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/command/businesses/${b.id}`}
                      className="text-sm underline-offset-4 hover:underline"
                    >
                      Open 360
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
