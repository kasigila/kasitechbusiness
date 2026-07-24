import type { Metadata } from "next";
import { PageHeader } from "@kasitech/ui";
import { requireCommandAccess } from "@/lib/auth/guards";
import { CreateBusinessForm } from "./create-form";

export const metadata: Metadata = {
  title: "Create Business",
};

export default async function CreateBusinessPage() {
  await requireCommandAccess();

  return (
    <div>
      <PageHeader
        title="Create Business"
        description="Creates tenant, subscription, entitlements, workspace draft, implementation project, owner invitation, and audit event — without new application code per client."
      />
      <CreateBusinessForm />
    </div>
  );
}
