import Link from "next/link";
import { Badge, Button } from "@kasitech/ui";
import { isCommandCenterAllowed } from "@kasitech/tenancy";
import { signOutAction } from "@/app/(public)/actions";
import {
  getActiveBusinessId,
  isUsingPreviewData,
  requireActor,
} from "@/lib/auth/guards";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actor = await requireActor();
  const activeBusinessId = await getActiveBusinessId(actor);
  const activeMembership = actor.memberships.find(
    (m) => m.businessId === activeBusinessId && m.status === "ACTIVE",
  );
  const preview = isUsingPreviewData();

  return (
    <div className="min-h-screen">
      {preview ? (
        <div className="bg-[var(--kb-ink)] px-4 py-2 text-center text-sm text-[var(--kb-ivory)]">
          Preview mode · demo data ·{" "}
          <Link href="/preview" className="underline underline-offset-4">
            Preview hub
          </Link>
        </div>
      ) : null}
      <header className="sticky top-0 z-20 border-b border-[var(--kb-border)] bg-[rgb(247_246_242_/0.92)] backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/app" className="shrink-0 font-semibold tracking-[-0.03em]">
              KasiTech Business
            </Link>
            <Badge>Workspace</Badge>
            {activeMembership ? (
              <span className="truncate text-sm text-[var(--kb-muted)]">
                {activeMembership.roleKey.replaceAll("_", " ")}
              </span>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <nav className="hidden items-center gap-3 text-sm md:flex">
              <Link href="/app" className="underline-offset-4 hover:underline">
                Overview
              </Link>
              <Link
                href="/app/team"
                className="underline-offset-4 hover:underline"
              >
                Team
              </Link>
              <Link
                href="/app/billing"
                className="underline-offset-4 hover:underline"
              >
                Billing
              </Link>
            </nav>
            {isCommandCenterAllowed(actor) ? (
              <Link
                href="/command"
                className="hidden text-sm font-medium underline-offset-4 hover:underline sm:inline"
              >
                Command
              </Link>
            ) : null}
            {!preview ? (
              <form action={signOutAction}>
                <Button type="submit" variant="secondary">
                  Sign out
                </Button>
              </form>
            ) : (
              <Link href="/login" className="kb-btn kb-btn-secondary">
                Login
              </Link>
            )}
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-6">{children}</div>
    </div>
  );
}
