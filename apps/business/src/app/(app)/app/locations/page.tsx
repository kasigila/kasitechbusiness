import type { Metadata } from "next";
import { Badge, PageHeader } from "@kasitech/ui";
import {
  getActiveBusinessId,
  isUsingPreviewData,
  requireActor,
} from "@/lib/auth/guards";
import { PREVIEW_LOCATIONS } from "@/lib/preview";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Locations" };

export default async function LocationsPage() {
  const actor = await requireActor();
  const businessId = await getActiveBusinessId(actor);

  let rows = PREVIEW_LOCATIONS.map((l) => ({
    id: l.id,
    name: l.name,
    address: l.address,
    status: l.status,
  }));

  if (!isUsingPreviewData() && businessId) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("locations")
      .select("id, name, address, status")
      .eq("business_id", businessId)
      .order("created_at", { ascending: true });
    rows = data ?? [];
  }

  return (
    <div>
      <PageHeader
        title="Locations"
        description="Physical sites for this business. Seat and location limits come from your plan."
      />

      <ul className="divide-y divide-[var(--kb-border)] rounded-2xl border border-[var(--kb-border)] bg-[var(--kb-surface)]">
        {rows.length === 0 ? (
          <li className="p-5 text-sm text-[var(--kb-muted)]">No locations yet.</li>
        ) : (
          rows.map((loc) => (
            <li
              key={loc.id}
              className="flex items-center justify-between gap-3 p-5 text-sm"
            >
              <div>
                <p className="font-medium">{loc.name}</p>
                <p className="text-[var(--kb-muted)]">{loc.address ?? "—"}</p>
              </div>
              <Badge tone={loc.status === "ACTIVE" ? "success" : "warning"}>
                {loc.status}
              </Badge>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
