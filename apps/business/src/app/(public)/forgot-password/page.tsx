import type { Metadata } from "next";
import { ForgotPasswordForm } from "./forgot-form";

export const metadata: Metadata = {
  title: "Forgot Password",
};

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--kb-muted)]">
            KasiTech Business
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.04em]">
            Reset your password
          </h1>
          <p className="mt-2 text-[var(--kb-muted)]">
            We&apos;ll email reset instructions if your account exists.
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--kb-border)] bg-[var(--kb-surface)] p-6 shadow-[var(--kb-shadow)] sm:p-8">
          <ForgotPasswordForm />
        </div>
      </div>
    </main>
  );
}
