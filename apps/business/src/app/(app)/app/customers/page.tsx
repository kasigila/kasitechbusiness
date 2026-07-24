import type { Metadata } from "next";
import { PageHeader } from "@kasitech/ui";
import { requireActor } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Guests" };

const GUESTS = [
  { name: "Asha Mwinyi", phone: "+255 712 000 111", tags: ["VIP", "Brunch"] },
  { name: "James Okello", phone: "+255 754 222 333", tags: ["Repeat"] },
  { name: "Neema Said", phone: "+255 713 444 555", tags: ["Events"] },
];

export default async function CustomersPage() {
  await requireActor();

  return (
    <div>
      <PageHeader
        title="Guests"
        description="Tenant-isolated CRM. Never shared across businesses."
      />
      <div className="grid gap-3">
        {GUESTS.map((g) => (
          <div
            key={g.phone}
            className="rounded-2xl border border-[var(--kb-border)] bg-[var(--kb-surface)] p-4"
          >
            <p className="font-semibold">{g.name}</p>
            <p className="text-sm text-[var(--kb-muted)]">{g.phone}</p>
            <p className="mt-2 text-xs text-[var(--kb-muted)]">
              {g.tags.join(" · ")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
