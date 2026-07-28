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

export async function upsertCatalogItemAction(
  _prev: ActionMessage | null,
  formData: FormData,
): Promise<ActionMessage> {
  const name = String(formData.get("name") || "").trim();
  const priceRaw = String(formData.get("priceMinor") || "").trim();
  const category = String(formData.get("category") || "General").trim();
  const availability = String(formData.get("availability") || "AVAILABLE").trim();

  if (!name) return fail("Item name is required.");
  const priceMinor = Number(priceRaw || "0");
  if (!Number.isFinite(priceMinor) || priceMinor < 0) {
    return fail("Enter a valid price in TZS.");
  }

  if (usingPreview()) {
    return previewSuccess(`Saved “${name}” (preview).`, { name, priceMinor });
  }

  const { tenant } = await requireTenantContext();
  if (!tenant.permissions.has("catalog.edit")) {
    return fail("You do not have permission to edit the catalog.");
  }

  const supabase = await createClient();
  const businessId = tenant.businessId;

  let { data: catalog } = await supabase
    .from("catalogs")
    .select("id")
    .eq("business_id", businessId)
    .limit(1)
    .maybeSingle();

  if (!catalog) {
    const { data: created, error } = await supabase
      .from("catalogs")
      .insert({ business_id: businessId, name: "Main", kind: "MENU" })
      .select("id")
      .single();
    if (error || !created) return fail("Could not create catalog.");
    catalog = created;
  }

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  let { data: catRow } = await supabase
    .from("catalog_categories")
    .select("id")
    .eq("catalog_id", catalog.id)
    .eq("slug", category.toLowerCase().replace(/\s+/g, "-"))
    .maybeSingle();

  if (!catRow) {
    const { data: createdCat } = await supabase
      .from("catalog_categories")
      .insert({
        business_id: businessId,
        catalog_id: catalog.id,
        name: category,
        slug: category.toLowerCase().replace(/\s+/g, "-"),
      })
      .select("id")
      .single();
    catRow = createdCat;
  }

  const { error } = await supabase.from("catalog_items").upsert(
    {
      business_id: businessId,
      catalog_id: catalog.id,
      category_id: catRow?.id ?? null,
      name,
      slug,
      price_minor: priceMinor,
      currency: "TZS",
      availability,
      status: "ACTIVE",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "catalog_id,slug" },
  );

  if (error) return fail("Could not save catalog item.");

  revalidatePath("/app/catalog");
  return liveSuccess(`Saved “${name}”.`);
}

export async function setCatalogAvailabilityAction(
  _prev: ActionMessage | null,
  formData: FormData,
): Promise<ActionMessage> {
  const itemId = String(formData.get("itemId") || "").trim();
  const availability = String(formData.get("availability") || "UNAVAILABLE").trim();
  if (!itemId) return fail("Item id required.");

  if (usingPreview()) {
    return previewSuccess(`Availability set to ${availability} (preview).`);
  }

  const { tenant } = await requireTenantContext();
  if (!tenant.permissions.has("catalog.edit")) {
    return fail("You do not have permission to edit the catalog.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("catalog_items")
    .update({ availability })
    .eq("id", itemId)
    .eq("business_id", tenant.businessId);

  if (error) return fail("Could not update availability.");
  revalidatePath("/app/catalog");
  return liveSuccess("Availability updated.");
}
