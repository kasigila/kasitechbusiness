import type { Metadata } from "next";
import { Button, EmptyState, PageHeader } from "@kasitech/ui";
import { setActiveBusinessAction } from "../../actions";
import { requireActor } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Select business",
};

export default async function SelectBusinessPage() {
  const actor = await requireActor();
  const active = actor.memberships.filter((m) => m.status === "ACTIVE");

  if (active.length === 0) {
    return (
      <div>
        <PageHeader title="Select business" />
        <EmptyState
          title="No business memberships yet"
          description="KasiTech administrators create businesses and send invitations. There is no public signup."
        />
      </div>
    );
  }

  const supabase = await createClient();
  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, display_name, slug, status")
    .in(
      "id",
      active.map((m) => m.businessId),
    );

  const byId = new Map((businesses ?? []).map((b) => [b.id, b]));

  return (
    <div>
      <PageHeader
        title="Select business"
        description="Your account can belong to multiple businesses. Choose which workspace to open."
      />
      <ul className="grid gap-3">
        {active.map((membership) => {
          const business = byId.get(membership.businessId);
          return (
            <li
              key={membership.id}
              className="flex flex-col gap-3 rounded-2xl border border-[var(--kb-border)] bg-[var(--kb-surface)] p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold">
                  {business?.display_name ?? membership.businessId}
                </p>
                <p className="text-sm text-[var(--kb-muted)]">
                  {membership.roleKey.replaceAll("_", " ")}
                  {business?.status ? ` · ${business.status}` : ""}
                </p>
              </div>
              <form action={setActiveBusinessAction}>
                <input
                  type="hidden"
                  name="businessId"
                  value={membership.businessId}
                />
                <Button type="submit">Open workspace</Button>
              </form>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
