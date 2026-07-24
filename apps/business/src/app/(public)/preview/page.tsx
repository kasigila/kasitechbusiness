import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@kasitech/ui";

export const metadata: Metadata = {
  title: "Preview",
  robots: { index: false, follow: false },
};

export default function PreviewHubPage() {
  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--kb-muted)]">
          KasiTech Business · UI Preview
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-[-0.04em] text-[var(--kb-ink)] sm:text-5xl">
          Explore the platform look
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-[var(--kb-muted)]">
          Preview mode uses demo data so you can review login, client workspace,
          and Command Center without connecting Supabase yet.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <PreviewCard
            title="Sign in"
            description="Client login screen — no public registration."
            href="/login"
            cta="Open login"
          />
          <PreviewCard
            title="Client workspace"
            description="Overview, team seats, and billing UX."
            href="/app"
            cta="Open workspace"
          />
          <PreviewCard
            title="Command Center"
            description="Internal businesses, create flow, and Business 360."
            href="/command"
            cta="Open command"
          />
          <PreviewCard
            title="Create Business"
            description="Super Admin tenant creation form."
            href="/command/businesses/new"
            cta="Open form"
          />
          <PreviewCard
            title="Discovery"
            description="Client questionnaire with draft workspace recommendation."
            href="/app/discovery"
            cta="Open discovery"
          />
          <PreviewCard
            title="Website CMS"
            description="Draft / edit / publish content surfaces."
            href="/app/website"
            cta="Open website"
          />
          <PreviewCard
            title="Public content API"
            description="Published CMS JSON for marketing sites."
            href="/api/v1/public/lido-slipway/en/content"
            cta="View JSON"
          />
          <PreviewCard
            title="Workspace composer"
            description="Command-side recommendation draft for hospitality."
            href="/command/workspace"
            cta="Open composer"
          />
        </div>

        <p className="mt-10 text-sm text-[var(--kb-muted)]">
          Preview is disabled in production unless explicitly allowed. Connect
          Supabase and set env vars for real authentication.
        </p>
      </div>
    </main>
  );
}

function PreviewCard({
  title,
  description,
  href,
  cta,
}: {
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--kb-border)] bg-[var(--kb-surface)] p-5 shadow-[var(--kb-shadow)]">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-[var(--kb-muted)]">{description}</p>
      <div className="mt-5">
        <Link href={href}>
          <Button>{cta}</Button>
        </Link>
      </div>
    </div>
  );
}
