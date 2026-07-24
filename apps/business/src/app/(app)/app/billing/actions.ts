"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireTenantContext } from "@/lib/auth/guards";
import { assertPermission } from "@kasitech/tenancy";

const schema = z.object({
  requestType: z.enum(["UPGRADE_PLAN", "ADDON", "LIMIT_INCREASE"]),
  targetPlanKey: z.string().optional(),
  targetAddonKey: z.string().optional(),
  featureKey: z.string().optional(),
  message: z.string().max(2000).optional(),
});

export type UpgradeActionState = {
  error?: string;
  success?: string;
};

export async function createUpgradeRequestAction(
  _prev: UpgradeActionState,
  formData: FormData,
): Promise<UpgradeActionState> {
  const parsed = schema.safeParse({
    requestType: formData.get("requestType"),
    targetPlanKey: formData.get("targetPlanKey") || undefined,
    targetAddonKey: formData.get("targetAddonKey") || undefined,
    featureKey: formData.get("featureKey") || undefined,
    message: formData.get("message") || undefined,
  });

  if (!parsed.success) {
    return { error: "Invalid upgrade request." };
  }

  const { actor, tenant } = await requireTenantContext();
  const permitted = assertPermission(tenant, "billing.request_upgrade");
  if (!permitted.ok) {
    return { error: "You don't have permission to request upgrades." };
  }

  const supabase = await createClient();

  let targetPlanId: string | null = null;
  let targetAddonId: string | null = null;

  if (parsed.data.targetPlanKey) {
    const { data } = await supabase
      .from("plans")
      .select("id")
      .eq("key", parsed.data.targetPlanKey)
      .maybeSingle();
    targetPlanId = data?.id ?? null;
  }

  if (parsed.data.targetAddonKey) {
    const { data } = await supabase
      .from("addons")
      .select("id")
      .eq("key", parsed.data.targetAddonKey)
      .maybeSingle();
    targetAddonId = data?.id ?? null;
  }

  const { error } = await supabase.from("upgrade_requests").insert({
    business_id: tenant.businessId,
    requested_by: actor.userId,
    request_type: parsed.data.requestType,
    target_plan_id: targetPlanId,
    target_addon_id: targetAddonId,
    feature_key: parsed.data.featureKey ?? null,
    message: parsed.data.message ?? null,
    status: "REQUESTED",
  });

  if (error) {
    return {
      error:
        "Could not submit upgrade request. Ensure commercial tables are migrated.",
    };
  }

  await supabase.from("audit_logs").insert({
    business_id: tenant.businessId,
    actor_user_id: actor.userId,
    actor_type: "USER",
    action: "billing.upgrade_request",
    resource_type: "upgrade_request",
    new_values: parsed.data,
  });

  return {
    success:
      "Upgrade request submitted. KasiTech will review — nothing is charged automatically.",
  };
}
