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
import { assertLocationAvailable } from "@/lib/entitlements/enforce";
import { getEffectiveEntitlements } from "@/lib/entitlements/load";
import { createClient } from "@/lib/supabase/server";

export async function createLocationAction(
  _prev: ActionMessage | null,
  formData: FormData,
): Promise<ActionMessage> {
  const name = String(formData.get("name") || "").trim();
  const address = String(formData.get("address") || "").trim();

  if (!name) return fail("Location name is required.");

  if (usingPreview()) {
    return previewSuccess(`Location “${name}” saved (preview).`);
  }

  const { tenant } = await requireTenantContext();
  if (!tenant.permissions.has("locations.manage")) {
    return fail("You do not have permission to manage locations.");
  }

  const entitlements = await getEffectiveEntitlements(tenant.businessId);
  if (!entitlements) return fail("Could not resolve plan entitlements.");

  const supabase = await createClient();
  const { count } = await supabase
    .from("locations")
    .select("id", { count: "exact", head: true })
    .eq("business_id", tenant.businessId)
    .eq("status", "ACTIVE");

  const check = assertLocationAvailable({
    entitlements,
    activeLocationCount: count ?? 0,
  });
  if (!check.ok) return fail(check.error.message);

  const { error } = await supabase.from("locations").insert({
    business_id: tenant.businessId,
    name,
    address: address || null,
    status: "ACTIVE",
    timezone: "Africa/Dar_es_Salaam",
  });

  if (error) return fail("Could not create location.");
  revalidatePath("/app/locations");
  return liveSuccess(`Location “${name}” created.`);
}
