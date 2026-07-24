import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Button, EmptyState, PageHeader } from "@kasitech/ui";
import { requireActor } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Website" };

export default async function WebsitePage() {
  await requireActor();

  return (
    <div>
      <PageHeader
        title="Website"
        description="Edit content — not unrestricted design. Draft, preview, then publish."
        actions={
          <div className="flex flex-wrap gap-2">
            <Badge tone="warning">STAGING</Badge>
            <Link href="/app/website/editor">
              <Button>Edit Website</Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Primary domain", value: "lido.co.tz (pending)" },
          { label: "Last published", value: "Not yet published" },
          { label: "Published by", value: "—" },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-[var(--kb-border)] bg-[var(--kb-surface)] p-5"
          >
            <p className="text-sm text-[var(--kb-muted)]">{card.label}</p>
            <p className="mt-2 font-semibold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <EmptyState
          title="Pages"
          description="Home, Menu, Events, Contact — structured sections only."
          action={
            <Link href="/app/website/editor" className="kb-btn kb-btn-primary">
              Open editor
            </Link>
          }
        />
        <EmptyState
          title="Request design change"
          description="Major redesigns and custom layouts are KasiTech Professional Services."
          action={
            <Link href="/app/support" className="kb-btn kb-btn-secondary">
              Request change
            </Link>
          }
        />
      </div>
    </div>
  );
}
