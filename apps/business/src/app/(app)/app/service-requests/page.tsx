import type { Metadata } from "next";
import { Badge, PageHeader } from "@kasitech/ui";
import { requireActor } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Service Requests" };

const REQUESTS = [
  { table: "Table 12", type: "CALL_WAITER", status: "OPEN", age: "2 min" },
  { table: "Table 4", type: "REQUEST_BILL", status: "ACCEPTED", age: "5 min" },
  { table: "Table 9", type: "REQUEST_WATER", status: "COMPLETED", age: "12 min" },
];

export default async function ServiceRequestsPage() {
  await requireActor();

  return (
    <div>
      <PageHeader
        title="Service requests"
        description="Table QR service — response time tracked. Non-emergency requests only."
      />
      <div className="grid gap-3">
        {REQUESTS.map((r) => (
          <div
            key={`${r.table}-${r.type}`}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--kb-border)] bg-[var(--kb-surface)] p-4"
          >
            <div>
              <p className="font-semibold">{r.table}</p>
              <p className="text-sm text-[var(--kb-muted)]">
                {r.type.replaceAll("_", " ")} · {r.age}
              </p>
            </div>
            <Badge
              tone={
                r.status === "OPEN"
                  ? "danger"
                  : r.status === "ACCEPTED"
                    ? "warning"
                    : "success"
              }
            >
              {r.status}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
