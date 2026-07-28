"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  isPreviewUiEnabled,
  PREVIEW_BUSINESS_ID,
  PREVIEW_PERSONA_COOKIE,
  type PreviewPersona,
} from "@/lib/preview";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const ACTIVE_BUSINESS_COOKIE = "kb_active_business";

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
  };
}

export async function mockLoginAction(formData: FormData) {
  if (!isPreviewUiEnabled() || isSupabaseConfigured()) {
    redirect("/login?error=config");
  }

  const persona = String(formData.get("persona") || "owner") as PreviewPersona;
  const safe: PreviewPersona = persona === "staff" ? "staff" : "owner";
  const nextRaw = String(formData.get("next") || "");
  const next =
    nextRaw.startsWith("/") && !nextRaw.startsWith("//")
      ? nextRaw
      : safe === "staff"
        ? "/command"
        : "/app";

  const store = await cookies();
  store.set(PREVIEW_PERSONA_COOKIE, safe, cookieOptions());
  store.set(ACTIVE_BUSINESS_COOKIE, PREVIEW_BUSINESS_ID, cookieOptions());

  redirect(next);
}

export async function mockLogoutAction() {
  const store = await cookies();
  store.delete(PREVIEW_PERSONA_COOKIE);
  store.delete(ACTIVE_BUSINESS_COOKIE);
  redirect("/login");
}
