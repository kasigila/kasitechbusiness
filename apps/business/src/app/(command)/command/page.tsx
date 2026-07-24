import type { Metadata } from "next";
import { EmptyState, PageHeader } from "@kasitech/ui";

export const metadata: Metadata = {
  title: "Command Center",
};

export default function CommandHomePage() {
  return (
    <div>
      <PageHeader
        title="Command Center"
        description="Internal KasiTech operations — businesses, subscriptions, implementation, and platform health. Not exposed in client navigation."
      />
      <div className="grid gap-4 md:grid-cols-2">
        <EmptyState
          title="Businesses"
          description="Create Business and Business 360 arrive in Phase 3."
        />
        <EmptyState
          title="Revenue & risk"
          description="MRR/ARR and past-due signals use billing records from Phase 9 — no vanity metrics placeholders."
        />
      </div>
    </div>
  );
}
