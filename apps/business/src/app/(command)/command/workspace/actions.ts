"use server";

import { revalidatePath } from "next/cache";
import { recommendWorkspace } from "@kasitech/workspace";
import {
  fail,
  liveSuccess,
  previewSuccess,
  usingPreview,
  type ActionMessage,
} from "@/lib/actions/result";
import { requireCommandAccess } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";

export async function publishWorkspaceRecommendationAction(
  _prev: ActionMessage | null,
  formData: FormData,
): Promise<ActionMessage> {
  const businessId = String(formData.get("businessId") || "").trim();
  if (!businessId) return fail("Business id is required.");

  const actor = await requireCommandAccess();

  if (usingPreview()) {
    return previewSuccess(
      "Workspace published (preview). Connect Supabase to update live navigation.",
      { businessId },
    );
  }

  try {
    const admin = createAdminClient();

    const { data: recommendation } = await admin
      .from("workspace_recommendations")
      .select("id, recommendation, status")
      .eq("business_id", businessId)
      .maybeSingle();

    let payload = recommendation?.recommendation as
      | {
          navigation?: unknown;
          widgets?: unknown;
          quickActions?: unknown;
          terminology?: unknown;
        }
      | null;

    if (!payload) {
      const draft = recommendWorkspace({
        industry: "hospitality",
        sells: ["food", "drinks"],
        operations: ["reservations", "tables"],
        morningPriorities: ["reservations"],
      });
      payload = {
        navigation: draft.navigation,
        widgets: draft.widgets,
        quickActions: draft.quickActions,
        terminology: draft.terminology,
      };
      await admin.from("workspace_recommendations").upsert({
        business_id: businessId,
        status: "PUBLISHED",
        recommendation: payload,
        created_by: actor.userId,
        published_at: new Date().toISOString(),
      });
    } else {
      await admin
        .from("workspace_recommendations")
        .update({
          status: "PUBLISHED",
          published_at: new Date().toISOString(),
        })
        .eq("business_id", businessId);
    }

    await admin.from("workspace_configs").upsert({
      business_id: businessId,
      status: "PUBLISHED",
      navigation: payload.navigation ?? [],
      widgets: payload.widgets ?? [],
      quick_actions: payload.quickActions ?? [],
      terminology: payload.terminology ?? {},
      published_at: new Date().toISOString(),
      published_by: actor.userId,
      updated_at: new Date().toISOString(),
    });

    await admin
      .from("discovery_questionnaires")
      .update({
        status: "REVIEWED",
        reviewed_at: new Date().toISOString(),
        reviewed_by: actor.userId,
      })
      .eq("business_id", businessId);

    await admin.from("audit_logs").insert({
      business_id: businessId,
      actor_user_id: actor.userId,
      actor_type: "STAFF",
      action: "workspace.publish",
      resource_type: "workspace_config",
      resource_id: businessId,
    });

    revalidatePath(`/command/businesses/${businessId}`);
    revalidatePath("/command/discovery");
    revalidatePath("/app");
    return liveSuccess("Workspace recommendation published for this business.");
  } catch {
    return fail("Could not publish workspace. Check service role configuration.");
  }
}
