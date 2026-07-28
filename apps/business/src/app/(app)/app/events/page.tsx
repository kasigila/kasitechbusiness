import type { Metadata } from "next";
import { Badge, PageHeader } from "@kasitech/ui";
import {
  isUsingPreviewData,
  requireTenantContext,
} from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { EventForms } from "./event-forms";

export const metadata: Metadata = { title: "Events" };

const PREVIEW = [
  { id: "1", name: "Bottomless Mimosas Brunch", when: "Sat 11:00", status: "PUBLISHED" },
  { id: "2", name: "Sunset Jazz", when: "Fri 18:00", status: "PUBLISHED" },
  { id: "3", name: "Private Yacht Club Dinner", when: "Thu 19:00", status: "DRAFT" },
];

export default async function EventsPage() {
  const { tenant } = await requireTenantContext();
  let rows = PREVIEW;

  if (!isUsingPreviewData()) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("events")
      .select("id, name, starts_at, status")
      .eq("business_id", tenant.businessId)
      .order("starts_at", { ascending: true });
    rows =
      data?.map((e) => ({
        id: e.id as string,
        name: e.name as string,
        when: new Date(e.starts_at as string).toLocaleString("en-TZ"),
        status: e.status as string,
      })) ?? [];
  }

  return (
    <div>
      <PageHeader
        title="Events"
        description="Publish featured events to the website after review."
      />
      <EventForms />
      <div className="mt-6 grid gap-3">
        {rows.map((event) => (
          <div
            key={event.id}
            className="rounded-2xl border border-[var(--kb-border)] bg-[var(--kb-surface)] p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{event.name}</p>
                <p className="text-sm text-[var(--kb-muted)]">{event.when}</p>
              </div>
              <Badge tone={event.status === "PUBLISHED" ? "success" : "neutral"}>
                {event.status}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
