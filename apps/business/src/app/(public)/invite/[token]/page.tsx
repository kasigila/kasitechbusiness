import type { Metadata } from "next";
import { EmptyState } from "@kasitech/ui";

export const metadata: Metadata = {
  title: "Invitation",
};

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <main className="mx-auto flex min-h-screen max-w-lg items-center px-4 py-10">
      <EmptyState
        title="Invitation acceptance"
        description={
          token
            ? "Invitation validation and membership activation land in Phase 4. Your secure token was received."
            : "Missing invitation token."
        }
      />
    </main>
  );
}
