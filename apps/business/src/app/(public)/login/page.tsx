import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign In",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const marketingUrl =
    process.env.NEXT_PUBLIC_MARKETING_URL || "https://kasitechinnovations.com";

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--kb-muted)]">
            KasiTech Business
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-[-0.04em] text-[var(--kb-ink)]">
            KasiTech Business
          </h1>
          <p className="mt-2 text-[var(--kb-muted)]">
            Your business. One platform.
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--kb-border)] bg-[var(--kb-surface)] p-6 shadow-[var(--kb-shadow)] sm:p-8">
          {params.error === "config" ? (
            <p className="mb-4 text-sm text-[var(--kb-warning)]" role="status">
              Authentication is not configured. Set Supabase environment
              variables to enable sign-in.
            </p>
          ) : null}
          <LoginForm nextPath={params.next} />
        </div>

        <footer className="mt-8 space-y-2 text-center text-sm text-[var(--kb-muted)]">
          <p>
            KasiTech Business is available exclusively to KasiTech clients.
          </p>
          <p>
            Interested in KasiTech?{" "}
            <Link
              href={marketingUrl}
              className="font-medium text-[var(--kb-ink)] underline-offset-4 hover:underline"
            >
              Visit KasiTech Innovations
            </Link>
            .
          </p>
        </footer>
      </div>
    </main>
  );
}
