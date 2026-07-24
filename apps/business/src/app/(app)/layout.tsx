import Link from "next/link";
import { Badge, Button } from "@kasitech/ui";
import { isCommandCenterAllowed } from "@kasitech/tenancy";
import { signOutAction } from "@/app/(public)/actions";
import { getActiveBusinessId, requireActor } from "@/lib/auth/guards";

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

  return (
    <div className="min-h-screen">
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
            {actor.memberships.filter((m) => m.status === "ACTIVE").length >
            1 ? (
              <Link
                href="/app/select-business"
                className="hidden text-sm text-[var(--kb-muted)] underline-offset-4 hover:underline sm:inline"
              >
                Switch business
              </Link>
            ) : null}
            {isCommandCenterAllowed(actor) ? (
              <Link
                href="/command"
                className="hidden text-sm font-medium underline-offset-4 hover:underline sm:inline"
              >
                Command
              </Link>
            ) : null}
            <form action={signOutAction}>
              <Button type="submit" variant="secondary">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-6">{children}</div>
    </div>
  );
}
