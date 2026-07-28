"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type AuthActionState = {
  error?: string;
  success?: string;
};

export async function signInAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return {
      error:
        "Authentication is not configured yet. Set Supabase environment variables.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "Invalid email or password." };
  }

  const next = String(formData.get("next") || "/app");
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/app";
  redirect(safeNext);
}

export async function requestPasswordResetAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") || "");
  const parsed = z.string().email().safeParse(email);

  if (!parsed.success) {
    return { error: "Enter a valid email address." };
  }

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return {
      error:
        "Authentication is not configured yet. Set Supabase environment variables.",
    };
  }

  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Always return a generic success message to avoid account enumeration.
  await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${appUrl}/login`,
  });

  return {
    success:
      "If that email is registered with KasiTech Business, reset instructions are on the way.",
  };
}

export async function signOutAction() {
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  try {
    const { cookies } = await import("next/headers");
    const { PREVIEW_PERSONA_COOKIE } = await import("@/lib/preview");
    const { ACTIVE_BUSINESS_COOKIE } = await import("@/lib/auth/guards");
    const store = await cookies();
    store.delete(PREVIEW_PERSONA_COOKIE);
    store.delete(ACTIVE_BUSINESS_COOKIE);
  } catch {
    // ignore cookie clear failures
  }

  redirect("/login");
}
