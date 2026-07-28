import type { Metadata } from "next";
import { PageHeader } from "@kasitech/ui";
import {
  isUsingPreviewData,
  requireTenantContext,
} from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { CustomerForms } from "./customer-forms";

export const metadata: Metadata = { title: "Guests" };

const PREVIEW = [
  { id: "1", full_name: "Asha Mwinyi", phone: "+255 712 000 111", tags: ["VIP", "Brunch"] },
  { id: "2", full_name: "James Okello", phone: "+255 754 222 333", tags: ["Repeat"] },
];

export default async function CustomersPage() {
  const { tenant } = await requireTenantContext();
  let rows = PREVIEW;

  if (!isUsingPreviewData()) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("customers")
      .select("id, full_name, phone, tags")
      .eq("business_id", tenant.businessId)
      .order("created_at", { ascending: false })
      .limit(50);
    rows =
      data?.map((c) => ({
        id: c.id as string,
        full_name: c.full_name as string,
        phone: (c.phone as string) ?? "—",
        tags: (c.tags as string[]) ?? [],
      })) ?? [];
  }

  return (
    <div>
      <PageHeader
        title="Guests"
        description="Tenant-isolated CRM. Never shared across businesses."
      />
      <CustomerForms />
      <div className="mt-6 grid gap-3">
        {rows.map((g) => (
          <div
            key={g.id}
            className="rounded-2xl border border-[var(--kb-border)] bg-[var(--kb-surface)] p-4"
          >
            <p className="font-semibold">{g.full_name}</p>
            <p className="text-sm text-[var(--kb-muted)]">{g.phone}</p>
            {g.tags.length ? (
              <p className="mt-2 text-xs text-[var(--kb-muted)]">{g.tags.join(" · ")}</p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
