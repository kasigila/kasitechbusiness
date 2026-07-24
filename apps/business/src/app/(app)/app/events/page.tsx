import type { Metadata } from "next";
import { Badge, Button, PageHeader } from "@kasitech/ui";
import { requireActor } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Events" };

const EVENTS = [
  {
    name: "Bottomless Mimosas Brunch",
    when: "Sat 11:00–15:00",
    capacity: "80 / 120",
    status: "PUBLISHED",
  },
  {
    name: "Sunset Jazz",
    when: "Fri 18:00–22:00",
    capacity: "45 / 90",
    status: "PUBLISHED",
  },
  {
    name: "Private Yacht Club Dinner",
    when: "Thu 19:00",
    capacity: "Invite only",
    status: "DRAFT",
  },
];

export default async function EventsPage() {
  await requireActor();

  return (
    <div>
      <PageHeader
        title="Events"
        description="Publish featured events to the website after review."
        actions={<Button>+ Add Event</Button>}
      />
      <div className="grid gap-3">
        {EVENTS.map((event) => (
          <div
            key={event.name}
            className="rounded-2xl border border-[var(--kb-border)] bg-[var(--kb-surface)] p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{event.name}</p>
                <p className="text-sm text-[var(--kb-muted)]">
                  {event.when} · {event.capacity}
                </p>
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
