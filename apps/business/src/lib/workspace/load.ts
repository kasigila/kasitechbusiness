import {
  filterNavigationByEntitlements,
  recommendWorkspace,
  type NavItem,
  type WorkspaceDefinition,
} from "@kasitech/workspace";
import { isFeatureEnabled, type EffectiveEntitlements } from "@kasitech/entitlements";
import { isUsingPreviewData } from "@/lib/auth/guards";
import { ensureWorkspaceExtensions } from "@/lib/workspace/extensions";

export function getPreviewWorkspace(): WorkspaceDefinition {
  ensureWorkspaceExtensions();
  return recommendWorkspace({
    industry: "hospitality",
    sells: ["food", "drinks", "experiences"],
    operations: ["reservations", "tables", "events", "customers"],
    morningPriorities: ["reservations", "service_requests"],
  });
}

export function entitlementsToFeatureSet(
  entitlements: EffectiveEntitlements,
): Set<string> {
  const enabled = new Set<string>();
  for (const [key, value] of entitlements.values) {
    if (value === "true" || value === "1") enabled.add(key);
    // limits imply the feature family is present when > 0 for some keys
    if (key.startsWith("max_") && Number(value) > 0) {
      if (key === "max_qr_codes") enabled.add("qr_enabled");
    }
  }
  // Always allow core nav when previewing
  if (isFeatureEnabled(entitlements, "catalog_enabled")) enabled.add("catalog_enabled");
  if (isFeatureEnabled(entitlements, "bookings_enabled")) enabled.add("bookings_enabled");
  if (isFeatureEnabled(entitlements, "events_enabled")) enabled.add("events_enabled");
  if (isFeatureEnabled(entitlements, "customers_enabled")) enabled.add("customers_enabled");
  if (isFeatureEnabled(entitlements, "qr_enabled")) enabled.add("qr_enabled");
  if (isFeatureEnabled(entitlements, "table_service_enabled"))
    enabled.add("table_service_enabled");
  if (isFeatureEnabled(entitlements, "basic_analytics_enabled"))
    enabled.add("basic_analytics_enabled");
  if (isFeatureEnabled(entitlements, "website_enabled")) enabled.add("website_enabled");
  return enabled;
}

export function navigationForPreview(): NavItem[] {
  const ws = getPreviewWorkspace();
  return filterNavigationByEntitlements(
    ws.navigation,
    new Set([
      "catalog_enabled",
      "bookings_enabled",
      "events_enabled",
      "customers_enabled",
      "qr_enabled",
      "table_service_enabled",
      "basic_analytics_enabled",
      "website_enabled",
    ]),
  );
}

export async function loadWorkspaceNav(): Promise<{
  nav: NavItem[];
  terminology: Record<string, string>;
  widgets: WorkspaceDefinition["widgets"];
  quickActions: WorkspaceDefinition["quickActions"];
}> {
  if (isUsingPreviewData()) {
    const ws = getPreviewWorkspace();
    return {
      nav: navigationForPreview(),
      terminology: ws.terminology,
      widgets: ws.widgets,
      quickActions: ws.quickActions,
    };
  }

  // Live path: fall back to recommendation defaults until composer publishes
  const ws = getPreviewWorkspace();
  const coreFeatures = new Set([
    "website_enabled",
    "catalog_enabled",
    "basic_analytics_enabled",
  ]);
  return {
    nav: filterNavigationByEntitlements(ws.navigation, coreFeatures),
    terminology: ws.terminology,
    widgets: ws.widgets,
    quickActions: ws.quickActions,
  };
}
