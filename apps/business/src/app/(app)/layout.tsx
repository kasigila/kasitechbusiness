import Link from "next/link";
import { Badge, Button } from "@kasitech/ui";
import { isCommandCenterAllowed } from "@kasitech/tenancy";
import { signOutAction } from "@/app/(public)/actions";
import {
  getActiveBusinessId,
  isUsingPreviewData,
  requireActor,
} from "@/lib/auth/guards";
import { loadWorkspaceNav } from "@/lib/workspace/load";

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
  const { nav } = await loadWorkspaceNav();

  const groups = new Map<string, typeof nav>();
  for (const item of nav) {
    const group = item.group ?? "MAIN";
    const list = groups.get(group) ?? [];
    list.push(item);
    groups.set(group, list);
  }

  return (
    <div className="min-h-screen">
      {preview ? (
        <div className="bg-[var(--kb-ink)] px-4 py-2 text-center text-sm text-[var(--kb-ivory)]">
          Preview · signed in as{" "}
          <strong>{actor.email}</strong>
          {actor.internalRoles.length ? " (KasiTech staff)" : " (demo customer)"}{" "}
          ·{" "}
          <Link href="/login" className="underline underline-offset-4">
            Switch account
          </Link>
        </div>
      ) : null}

      <div className="mx-auto flex min-h-screen max-w-7xl">
        <aside className="hidden w-60 shrink-0 border-r border-[var(--kb-border)] bg-[var(--kb-surface)]/80 px-3 py-4 md:block">
          <Link href="/app" className="block px-2 font-semibold tracking-[-0.03em]">
            KasiTech Business
          </Link>
          <p className="mt-1 px-2 text-xs text-[var(--kb-muted)]">
            {activeMembership?.roleKey.replaceAll("_", " ") ?? "Workspace"}
          </p>
          <nav className="mt-6 space-y-5">
            {[...groups.entries()].map(([group, items]) => (
              <div key={group}>
                {group !== "MAIN" ? (
                  <p className="mb-2 px-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--kb-muted)]">
                    {group}
                  </p>
                ) : null}
                <ul className="space-y-1">
                  {items.map((item) => (
                    <li key={item.key}>
                      <Link
                        href={item.href}
                        className="block rounded-lg px-2 py-2 text-sm hover:bg-[var(--kb-surface-2)]"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-[var(--kb-border)] bg-[rgb(247_246_242_/0.92)] backdrop-blur">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-2 md:hidden">
                <Link href="/app" className="font-semibold">
                  KasiTech
                </Link>
                <Badge>Workspace</Badge>
              </div>
              <div className="hidden text-sm text-[var(--kb-muted)] md:block">
                Your business. One platform.
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/app/onboarding"
                  className="hidden text-sm underline-offset-4 hover:underline sm:inline"
                >
                  Onboarding
                </Link>
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
                  <form action={signOutAction}>
                    <Button type="submit" variant="secondary">
                      End mock login
                    </Button>
                  </form>
                )}
              </div>
            </div>
            <nav className="flex gap-2 overflow-x-auto px-4 pb-3 md:hidden">
              {nav.slice(0, 8).map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className="shrink-0 rounded-full border border-[var(--kb-border)] bg-[var(--kb-surface)] px-3 py-1.5 text-xs"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </header>
          <div className="px-4 py-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
