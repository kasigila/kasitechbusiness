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

export async function upsertCustomerAction(
  _prev: ActionMessage | null,
  formData: FormData,
): Promise<ActionMessage> {
  const fullName = String(formData.get("fullName") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const notes = String(formData.get("notes") || "").trim();

  if (!fullName) return fail("Name is required.");

  if (usingPreview()) {
    return previewSuccess(`Guest “${fullName}” saved (preview).`);
  }

  const { tenant } = await requireTenantContext();
  if (!tenant.permissions.has("customers.view")) {
    return fail("You do not have permission to manage customers.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("customers").insert({
    business_id: tenant.businessId,
    full_name: fullName,
    phone: phone || null,
    email: email || null,
    notes: notes || null,
  });

  if (error) return fail("Could not save customer.");
  revalidatePath("/app/customers");
  return liveSuccess(`Saved “${fullName}”.`);
}
