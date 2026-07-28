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

type InviteLookup =
  | { kind: "unconfigured" }
  | { kind: "missing_token" }
  | { kind: "not_found" }
  | { kind: "unavailable" }
  | { kind: "error" }
  | {
      kind: "ok";
      email: string;
      businessName: string;
    };

async function lookupInvitation(token: string): Promise<InviteLookup> {
  if (!token) return { kind: "missing_token" };

  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { kind: "unconfigured" };
  }

  try {
    const admin = createAdminClient();
    const tokenHash = hashInvitationToken(token);
    const { data: invitation } = await admin
      .from("invitations")
      .select("id, email, status, expires_at, businesses(display_name)")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (!invitation) return { kind: "not_found" };

    if (
      invitation.status !== "PENDING" ||
      isInvitationExpired(invitation.expires_at)
    ) {
      return { kind: "unavailable" };
    }

    const business = Array.isArray(invitation.businesses)
      ? invitation.businesses[0]
      : invitation.businesses;

    return {
      kind: "ok",
      email: invitation.email,
      businessName: business?.display_name ?? "your business",
    };
  } catch {
    return { kind: "error" };
  }
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await lookupInvitation(token);

  if (result.kind === "missing_token") {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg items-center px-4 py-10">
        <EmptyState
          title="Missing invitation"
          description="This link is incomplete. Ask your KasiTech contact for a new invite."
        />
      </main>
    );
  }

  if (result.kind === "unconfigured") {
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

  if (result.kind === "not_found") {
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

  if (result.kind === "unavailable") {
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

  if (result.kind === "error") {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg items-center px-4 py-10">
        <EmptyState
          title="Temporarily unavailable"
          description="Could not validate this invitation. Try again shortly."
        />
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg items-center px-4 py-10">
      <div className="w-full rounded-2xl border border-[var(--kb-border)] bg-[var(--kb-surface)] p-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Join {result.businessName}
        </h1>
        <p className="mt-2 text-sm text-[var(--kb-muted)]">
          Create your KasiTech Business password to activate access. There is no
          public registration — this invite is required.
        </p>
        <InviteAcceptForm
          token={token}
          email={result.email}
          businessName={result.businessName}
        />
      </div>
    </main>
  );
}
