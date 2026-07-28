"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACTIVE_BUSINESS_COOKIE, requireActor } from "@/lib/auth/guards";

export async function setActiveBusinessAction(formData: FormData) {
  const actor = await requireActor();
  const businessId = String(formData.get("businessId") || "");

  const allowed = actor.memberships.some(
    (m) => m.businessId === businessId && m.status === "ACTIVE",
  );

  if (!allowed) {
    redirect("/app/select-business?error=invalid_business");
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_BUSINESS_COOKIE, businessId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  redirect("/app");
}
