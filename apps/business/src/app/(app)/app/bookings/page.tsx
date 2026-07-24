import type { Metadata } from "next";
import { Badge, PageHeader } from "@kasitech/ui";
import { requireActor } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Reservations" };

const BOOKINGS = [
  { name: "Asha M.", time: "12:30", party: 4, status: "CONFIRMED" },
  { name: "James K.", time: "13:00", party: 2, status: "PENDING" },
  { name: "Neema S.", time: "19:00", party: 6, status: "CONFIRMED" },
  { name: "Walk-in", time: "19:45", party: 3, status: "ARRIVED" },
];

export default async function BookingsPage() {
  await requireActor();

  return (
    <div>
      <PageHeader
        title="Reservations today"
        description="Reusable booking engine — restaurant reservation mode. Timezone: Africa/Dar_es_Salaam."
      />
      <div className="grid gap-3">
        {BOOKINGS.map((b) => (
          <div
            key={`${b.name}-${b.time}`}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--kb-border)] bg-[var(--kb-surface)] p-4"
          >
            <div>
              <p className="font-semibold">{b.name}</p>
              <p className="text-sm text-[var(--kb-muted)]">
                {b.time} · party of {b.party}
              </p>
            </div>
            <Badge
              tone={
                b.status === "CONFIRMED" || b.status === "ARRIVED"
                  ? "success"
                  : "warning"
              }
            >
              {b.status}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
