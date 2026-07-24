import Link from "next/link";
import { Badge, Button } from "@kasitech/ui";
import { signOutAction } from "@/app/(public)/actions";
import { requireCommandAccess } from "@/lib/auth/guards";

/**
 * Command Center is intentionally outside ordinary business navigation.
 * Access is gated by internal_roles via requireCommandAccess().
 */
export default async function CommandLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actor = await requireCommandAccess();

  return (
    <div className="min-h-screen bg-[var(--kb-ink)] text-[var(--kb-ivory)]">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/command" className="font-semibold tracking-[-0.03em]">
              KasiTech Command
            </Link>
            <Badge tone="warning">Internal</Badge>
            <span className="hidden text-sm text-white/60 sm:inline">
              {actor.internalRoles.join(" · ")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/app"
              className="text-sm text-white/70 underline-offset-4 hover:underline"
            >
              Client workspace
            </Link>
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
