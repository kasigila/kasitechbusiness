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

export async function createBookingAction(
  _prev: ActionMessage | null,
  formData: FormData,
): Promise<ActionMessage> {
  const customerName = String(formData.get("customerName") || "").trim();
  const startsAt = String(formData.get("startsAt") || "").trim();
  const partySize = Number(formData.get("partySize") || "2");
  const phone = String(formData.get("customerPhone") || "").trim();

  if (!customerName || !startsAt) {
    return fail("Guest name and time are required.");
  }

  if (usingPreview()) {
    return previewSuccess(`Reservation for ${customerName} saved (preview).`);
  }

  const { tenant } = await requireTenantContext();
  if (!tenant.permissions.has("bookings.manage")) {
    return fail("You do not have permission to manage bookings.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("bookings").insert({
    business_id: tenant.businessId,
    customer_name: customerName,
    customer_phone: phone || null,
    starts_at: new Date(startsAt).toISOString(),
    party_size: Number.isFinite(partySize) ? partySize : 2,
    status: "PENDING",
  });

  if (error) return fail("Could not create booking.");
  revalidatePath("/app/bookings");
  return liveSuccess("Reservation created.");
}

export async function updateBookingStatusAction(
  _prev: ActionMessage | null,
  formData: FormData,
): Promise<ActionMessage> {
  const bookingId = String(formData.get("bookingId") || "").trim();
  const status = String(formData.get("status") || "").trim();
  if (!bookingId || !status) return fail("Booking and status required.");

  if (usingPreview()) {
    return previewSuccess(`Booking marked ${status} (preview).`);
  }

  const { tenant } = await requireTenantContext();
  if (!tenant.permissions.has("bookings.manage")) {
    return fail("You do not have permission to manage bookings.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("bookings")
    .update({ status })
    .eq("id", bookingId)
    .eq("business_id", tenant.businessId);

  if (error) return fail("Could not update booking.");
  revalidatePath("/app/bookings");
  return liveSuccess(`Booking marked ${status}.`);
}
