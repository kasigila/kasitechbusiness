import type { Metadata } from "next";
import { Badge, PageHeader } from "@kasitech/ui";
import {
  isUsingPreviewData,
  requireTenantContext,
} from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { BookingForms } from "./booking-forms";

export const metadata: Metadata = { title: "Reservations" };

const PREVIEW = [
  { id: "1", customer_name: "Asha M.", starts_at: "12:30", party_size: 4, status: "CONFIRMED" },
  { id: "2", customer_name: "James K.", starts_at: "13:00", party_size: 2, status: "PENDING" },
  { id: "3", customer_name: "Neema S.", starts_at: "19:00", party_size: 6, status: "CONFIRMED" },
];

export default async function BookingsPage() {
  const { tenant } = await requireTenantContext();
  let rows = PREVIEW;

  if (!isUsingPreviewData()) {
    const supabase = await createClient();
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const { data } = await supabase
      .from("bookings")
      .select("id, customer_name, starts_at, party_size, status")
      .eq("business_id", tenant.businessId)
      .gte("starts_at", start.toISOString())
      .lte("starts_at", end.toISOString())
      .order("starts_at");

    rows =
      data?.map((b) => ({
        id: b.id as string,
        customer_name: (b.customer_name as string) ?? "—",
        starts_at: new Date(b.starts_at as string).toLocaleTimeString("en-TZ", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        party_size: (b.party_size as number) ?? 0,
        status: b.status as string,
      })) ?? [];
  }

  return (
    <div>
      <PageHeader
        title="Reservations today"
        description="Reusable booking engine — restaurant reservation mode. Timezone: Africa/Dar_es_Salaam."
      />
      <BookingForms />
      <div className="mt-6 grid gap-3">
        {rows.length === 0 ? (
          <p className="text-sm text-[var(--kb-muted)]">No reservations yet today.</p>
        ) : (
          rows.map((b) => (
            <div
              key={b.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--kb-border)] bg-[var(--kb-surface)] p-4"
            >
              <div>
                <p className="font-semibold">{b.customer_name}</p>
                <p className="text-sm text-[var(--kb-muted)]">
                  {b.starts_at} · party of {b.party_size}
                </p>
              </div>
              <Badge tone={b.status === "CONFIRMED" || b.status === "ARRIVED" ? "success" : "warning"}>
                {b.status}
              </Badge>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
