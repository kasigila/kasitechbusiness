import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader } from "@kasitech/ui";
import { requireCommandAccess, isUsingPreviewData } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { PREVIEW_BUSINESS } from "@/lib/preview";
import { PublishWorkspaceButton } from "../workspace/publish-button";

export const metadata: Metadata = { title: "Discovery" };

export default async function CommandDiscoveryPage() {
  await requireCommandAccess();

  type Row = {
    id: string;
    status: string;
    business_id: string;
    submitted_at: string | null;
    created_at: string;
    businesses?: { display_name: string; slug: string } | null;
  };

  let rows: Row[] = [];

  if (isUsingPreviewData()) {
    rows = [
      {
        id: "preview-discovery",
        status: "SUBMITTED",
        business_id: PREVIEW_BUSINESS.id,
        submitted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        businesses: {
          display_name: PREVIEW_BUSINESS.display_name,
          slug: PREVIEW_BUSINESS.slug,
        },
      },
    ];
  } else {
    try {
      const admin = createAdminClient();
      const { data } = await admin
        .from("discovery_questionnaires")
        .select(
          "id, status, business_id, submitted_at, created_at, businesses(display_name, slug)",
        )
        .order("created_at", { ascending: false })
        .limit(50);
      rows = (data as Row[] | null) ?? [];
    } catch {
      rows = [];
    }
  }

  return (
    <div>
      <PageHeader
        title="Discovery"
        description="Review client questionnaires and publish workspace recommendations."
      />

      {rows.length === 0 ? (
        <p className="text-sm text-white/70">No discovery questionnaires yet.</p>
      ) : (
        <ul className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/5">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm"
            >
              <div>
                <p className="font-medium">
                  {row.businesses?.display_name ?? "Business"}
                </p>
                <p className="text-xs text-white/55">
                  {row.status}
                  {row.submitted_at
                    ? ` · submitted ${new Date(row.submitted_at).toLocaleString()}`
                    : ` · created ${new Date(row.created_at).toLocaleString()}`}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <PublishWorkspaceButton businessId={row.business_id} />
                <Link
                  href={`/command/businesses/${row.business_id}`}
                  className="text-xs font-medium underline underline-offset-4"
                >
                  Open 360
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
