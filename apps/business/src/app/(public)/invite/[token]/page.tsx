import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@kasitech/ui";
import {
  hashInvitationToken,
  isInvitationExpired,
} from "@kasitech/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { InviteAcceptForm } from "./invite-form";

export const metadata: Metadata = {
  title: "Invitation",
};

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!token) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg items-center px-4 py-10">
        <EmptyState
          title="Missing invitation"
          description="This link is incomplete. Ask your KasiTech contact for a new invite."
        />
      </main>
    );
  }

  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg items-center px-4 py-10">
        <div className="w-full rounded-2xl border border-[var(--kb-border)] bg-[var(--kb-surface)] p-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            Accept invitation
          </h1>
          <p className="mt-2 text-sm text-[var(--kb-muted)]">
            Preview / unconfigured environment — invitation tokens cannot be
            validated until Supabase is connected. Token received (
            {token.slice(0, 8)}…).
          </p>
          <Link href="/login" className="kb-btn kb-btn-secondary mt-6 inline-flex">
            Go to login
          </Link>
        </div>
      </main>
    );
  }

  try {
    const admin = createAdminClient();
    const tokenHash = hashInvitationToken(token);
    const { data: invitation } = await admin
      .from("invitations")
      .select(
        "id, email, status, expires_at, businesses(display_name)",
      )
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (!invitation) {
      return (
        <main className="mx-auto flex min-h-screen max-w-lg items-center px-4 py-10">
          <EmptyState
            title="Invitation not found"
            description="This link is invalid or was revoked."
            action={
              <Link href="/login" className="kb-btn kb-btn-secondary">
                Go to login
              </Link>
            }
          />
        </main>
      );
    }

    if (invitation.status !== "PENDING" || isInvitationExpired(invitation.expires_at)) {
      return (
        <main className="mx-auto flex min-h-screen max-w-lg items-center px-4 py-10">
          <EmptyState
            title="Invitation unavailable"
            description="This invitation was already used or has expired."
            action={
              <Link href="/login" className="kb-btn kb-btn-secondary">
                Go to login
              </Link>
            }
          />
        </main>
      );
    }

    const business = Array.isArray(invitation.businesses)
      ? invitation.businesses[0]
      : invitation.businesses;

    return (
      <main className="mx-auto flex min-h-screen max-w-lg items-center px-4 py-10">
        <div className="w-full rounded-2xl border border-[var(--kb-border)] bg-[var(--kb-surface)] p-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            Join {business?.display_name ?? "your business"}
          </h1>
          <p className="mt-2 text-sm text-[var(--kb-muted)]">
            Create your KasiTech Business password to activate access. There is
            no public registration — this invite is required.
          </p>
          <InviteAcceptForm
            token={token}
            email={invitation.email}
            businessName={business?.display_name ?? "your business"}
          />
        </div>
      </main>
    );
  } catch {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg items-center px-4 py-10">
        <EmptyState
          title="Temporarily unavailable"
          description="Could not validate this invitation. Try again shortly."
        />
      </main>
    );
  }
}
