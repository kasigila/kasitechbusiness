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
import { requireTenantContext } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

export async function saveDiscoveryAction(
  _prev: ActionMessage | null,
  formData: FormData,
): Promise<ActionMessage> {
  const sells = String(formData.get("sells") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const operations = String(formData.get("operations") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const priorities = String(formData.get("priorities") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const pain = String(formData.get("pain") || "").trim();
  const industry = String(formData.get("industry") || "hospitality").trim();

  const recommendation = recommendWorkspace({
    industry,
    sells,
    operations,
    morningPriorities: priorities,
  });

  if (usingPreview()) {
    return previewSuccess(
      "Discovery saved for KasiTech review (preview). Recommendation stays unpublished.",
      { recommendation },
    );
  }

  const { actor, tenant } = await requireTenantContext();
  const supabase = await createClient();
  const businessId = tenant.businessId;

  let { data: questionnaire } = await supabase
    .from("discovery_questionnaires")
    .select("id")
    .eq("business_id", businessId)
    .maybeSingle();

  if (!questionnaire) {
    const { data: created, error } = await supabase
      .from("discovery_questionnaires")
      .insert({
        business_id: businessId,
        status: "SUBMITTED",
        submitted_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error || !created) return fail("Could not create discovery questionnaire.");
    questionnaire = created;
  } else {
    await supabase
      .from("discovery_questionnaires")
      .update({
        status: "SUBMITTED",
        submitted_at: new Date().toISOString(),
      })
      .eq("id", questionnaire.id);
  }

  const answers = [
    { section_key: "sells", question_key: "what_you_sell", answer: { values: sells } },
    {
      section_key: "operations",
      question_key: "daily_ops",
      answer: { values: operations },
    },
    {
      section_key: "priorities",
      question_key: "morning",
      answer: { values: priorities },
    },
    { section_key: "pain", question_key: "frustration", answer: { text: pain } },
    { section_key: "industry", question_key: "primary", answer: { value: industry } },
  ];

  for (const row of answers) {
    await supabase.from("discovery_responses").upsert(
      {
        questionnaire_id: questionnaire.id,
        section_key: row.section_key,
        question_key: row.question_key,
        answer: row.answer,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "questionnaire_id,section_key,question_key" },
    );
  }

  await supabase.from("workspace_recommendations").upsert(
    {
      business_id: businessId,
      status: "DRAFT",
      recommendation: {
        navigation: recommendation.navigation,
        widgets: recommendation.widgets,
        quickActions: recommendation.quickActions,
        terminology: recommendation.terminology,
      },
      created_by: actor.userId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "business_id" },
  );

  revalidatePath("/app/discovery");
  revalidatePath("/command/discovery");
  return liveSuccess(
    "Saved for KasiTech review. Recommendation stays unpublished until an admin accepts it.",
  );
}
