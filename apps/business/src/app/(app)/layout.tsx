import Link from "next/link";
import { Badge, Button, PageHeader } from "@kasitech/ui";
import { signOutAction } from "@/app/(public)/actions";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-[var(--kb-border)] bg-[rgb(247_246_242_/0.92)] backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/app" className="font-semibold tracking-[-0.03em]">
              KasiTech Business
            </Link>
            <Badge>Workspace</Badge>
          </div>
          <form action={signOutAction}>
            <Button type="submit" variant="secondary">
              Sign out
            </Button>
          </form>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-6">{children}</div>
    </div>
  );
}

export function AppShellHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return <PageHeader title={title} description={description} />;
}
