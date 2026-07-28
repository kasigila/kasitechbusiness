import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  isCommandCenterAllowed,
  resolveTenantContext,
  type ActorContext,
  type TenantContext,
} from "@kasitech/tenancy";
import { getActorContext } from "@/lib/auth/actor";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  getPreviewActor,
  isPreviewUiEnabled,
  parsePreviewPersona,
  PREVIEW_BUSINESS_ID,
  PREVIEW_PERSONA_COOKIE,
} from "@/lib/preview";

export const ACTIVE_BUSINESS_COOKIE = "kb_active_business";

async function resolvePreviewActor(): Promise<ActorContext> {
  const store = await cookies();
  const persona = parsePreviewPersona(
    store.get(PREVIEW_PERSONA_COOKIE)?.value,
  );
  // Default to customer/owner so demos match what clients will see.
  return getPreviewActor(persona ?? "owner");
}

export async function requireActor(): Promise<ActorContext> {
  if (isSupabaseConfigured()) {
    const actor = await getActorContext();
    if (actor) return actor;
    if (!isPreviewUiEnabled()) {
      redirect("/login");
    }
  } else if (!isPreviewUiEnabled()) {
    redirect("/login?error=config");
  }

  return resolvePreviewActor();
}

export async function requireCommandAccess(): Promise<ActorContext> {
  const actor = await requireActor();
  if (!isCommandCenterAllowed(actor)) {
    redirect("/app?error=unauthorized_command");
  }
  return actor;
}

export async function getActiveBusinessId(
  actor: ActorContext,
): Promise<string | null> {
  const cookieStore = await cookies();
  const preferred = cookieStore.get(ACTIVE_BUSINESS_COOKIE)?.value;
  const activeIds = new Set(
    actor.memberships
      .filter((m) => m.status === "ACTIVE")
      .map((m) => m.businessId),
  );

  if (preferred && activeIds.has(preferred)) {
    return preferred;
  }

  if (activeIds.size === 1) {
    return [...activeIds][0] ?? null;
  }

  if (isPreviewUiEnabled() && activeIds.has(PREVIEW_BUSINESS_ID)) {
    return PREVIEW_BUSINESS_ID;
  }

  return null;
}

export async function requireTenantContext(): Promise<{
  actor: ActorContext;
  tenant: TenantContext;
}> {
  const actor = await requireActor();
  const businessId = await getActiveBusinessId(actor);
  const resolved = resolveTenantContext(actor, businessId);

  if (!resolved.ok) {
    if (resolved.error.code === "UNAUTHENTICATED") {
      redirect("/login");
    }
    redirect("/app/select-business");
  }

  return { actor, tenant: resolved.data };
}

export function isUsingPreviewData(): boolean {
  return isPreviewUiEnabled() && !isSupabaseConfigured();
}
