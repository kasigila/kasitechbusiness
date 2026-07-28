import { registerWidget } from "@kasitech/workspace";

let registered = false;

/**
 * Tenant/extension widget registration — call once at server boot of workspace UI.
 * Prefer config + registration over hard-coding customer names.
 */
export function ensureWorkspaceExtensions() {
  if (registered) return;
  registered = true;

  registerWidget({
    type: "implementation_progress",
    title: "Implementation progress",
    description: "Onboarding project completion for this tenant",
  });

  registerWidget({
    type: "open_support_tickets",
    title: "Open support tickets",
    description: "Unresolved tickets for the active business",
    requiredEntitlement: "basic_analytics_enabled",
  });
}
