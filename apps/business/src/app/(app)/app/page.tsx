import type { Metadata } from "next";
import { EmptyState, PageHeader } from "@kasitech/ui";

export const metadata: Metadata = {
  title: "Overview",
};

export default function AppHomePage() {
  return (
    <div>
      <PageHeader
        title="Welcome to KasiTech Business"
        description="Your configured workspace will appear here after onboarding and launch. Phase 1 establishes secure tenancy foundations."
      />
      <EmptyState
        title="Workspace configuration pending"
        description="KasiTech configures modules from discovery and plan entitlements. You will not be left with an empty generic dashboard at launch."
      />
    </div>
  );
}
