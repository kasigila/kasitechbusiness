"use server";

import { revalidatePath } from "next/cache";
import {
  fail,
  liveSuccess,
  previewSuccess,
  usingPreview,
  type ActionMessage,
} from "@/lib/actions/result";
import { requireTenantContext } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

export async function upsertEventAction(
  _prev: ActionMessage | null,
  formData: FormData,
): Promise<ActionMessage> {
  const name = String(formData.get("name") || "").trim();
  const startsAt = String(formData.get("startsAt") || "").trim();
  const priceMinor = Number(formData.get("priceMinor") || "0");
  const status = String(formData.get("status") || "DRAFT").trim();

  if (!name || !startsAt) return fail("Event name and start time are required.");

  if (usingPreview()) {
    return previewSuccess(`Event “${name}” saved (preview).`);
  }

  const { tenant } = await requireTenantContext();
  const supabase = await createClient();
  const { error } = await supabase.from("events").insert({
    business_id: tenant.businessId,
    name,
    starts_at: new Date(startsAt).toISOString(),
    price_minor: Number.isFinite(priceMinor) ? priceMinor : 0,
    currency: "TZS",
    status,
  });

  if (error) return fail("Could not save event.");
  revalidatePath("/app/events");
  return liveSuccess(`Event “${name}” saved.`);
}
