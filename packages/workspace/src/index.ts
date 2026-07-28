export type NavItem = {
  key: string;
  label: string;
  href: string;
  group?: string;
  icon?: string;
  entitlement?: string;
  capability?: string;
};

export type WidgetConfig = {
  type: string;
  size?: "sm" | "md" | "lg";
  settings?: Record<string, unknown>;
};

export type QuickAction = {
  key: string;
  label: string;
  href: string;
};

export type WorkspaceDefinition = {
  navigation: NavItem[];
  widgets: WidgetConfig[];
  quickActions: QuickAction[];
  terminology: Record<string, string>;
};

export type WidgetRegistration = {
  type: string;
  title: string;
  description?: string;
  requiredEntitlement?: string;
  requiredCapability?: string;
  /** Optional tenant allowlist — empty means available to all entitled tenants */
  businessIds?: string[];
};

const customWidgets = new Map<string, WidgetRegistration>();

export function registerWidget(registration: WidgetRegistration) {
  customWidgets.set(registration.type, registration);
}

export function getRegisteredWidgets(): WidgetRegistration[] {
  return [...customWidgets.values()];
}

export function resolveTerminology(
  map: Record<string, string>,
  key: string,
  fallback?: string,
): string {
  return map[key] ?? fallback ?? key;
}

/** Build recommendation from discovery answers (structured). */
export function recommendWorkspace(input: {
  industry: string;
  sells: string[];
  operations: string[];
  morningPriorities: string[];
}): WorkspaceDefinition {
  const terminology: Record<string, string> = {};
  const navigation: NavItem[] = [
    { key: "overview", label: "Overview", href: "/app", group: "MAIN" },
    { key: "website", label: "Website", href: "/app/website", group: "WEBSITE" },
  ];
  const widgets: WidgetConfig[] = [
    { type: "website_visitors", size: "md" },
    { type: "contact_clicks", size: "sm" },
  ];
  const quickActions: QuickAction[] = [
    { key: "edit_website", label: "Edit Website", href: "/app/website" },
  ];

  const sells = new Set(input.sells);
  const ops = new Set(input.operations);

  if (sells.has("food") || sells.has("drinks") || input.industry === "hospitality") {
    terminology.customer = "guest";
    terminology.catalog = "menu";
    terminology.booking = "reservation";
    navigation.push({
      key: "catalog",
      label: "Menu",
      href: "/app/catalog",
      group: "WEBSITE",
      entitlement: "catalog_enabled",
    });
    widgets.push({ type: "menu_activity", size: "md" });
    quickActions.push({
      key: "mark_unavailable",
      label: "Mark Menu Item Unavailable",
      href: "/app/catalog",
    });
  } else if (input.industry === "beauty_wellness" || sells.has("services")) {
    terminology.customer = "client";
    terminology.catalog = "services";
    terminology.booking = "appointment";
    terminology.staff = "stylists";
    navigation.push({
      key: "catalog",
      label: "Services",
      href: "/app/catalog",
      group: "WEBSITE",
      entitlement: "catalog_enabled",
    });
    widgets.push({ type: "popular_services", size: "md" });
    quickActions.push({
      key: "add_service",
      label: "Add Service",
      href: "/app/catalog",
    });
  } else {
    navigation.push({
      key: "catalog",
      label: "Products / Services",
      href: "/app/catalog",
      group: "WEBSITE",
      entitlement: "catalog_enabled",
    });
    quickActions.push({
      key: "add_item",
      label: "Add Product/Service",
      href: "/app/catalog",
    });
  }

  if (
    ops.has("bookings") ||
    ops.has("appointments") ||
    ops.has("reservations") ||
    sells.has("appointments") ||
    sells.has("reservations")
  ) {
    navigation.push({
      key: "bookings",
      label: terminology.booking
        ? `${terminology.booking[0]!.toUpperCase()}${terminology.booking.slice(1)}s`
        : "Bookings",
      href: "/app/bookings",
      group: "OPERATIONS",
      entitlement: "bookings_enabled",
    });
    widgets.push({ type: "bookings_today", size: "md" });
    quickActions.push({
      key: "view_bookings",
      label: "View Bookings",
      href: "/app/bookings",
    });
  }

  if (ops.has("events") || sells.has("experiences")) {
    navigation.push({
      key: "events",
      label: "Events",
      href: "/app/events",
      group: "OPERATIONS",
      entitlement: "events_enabled",
    });
    widgets.push({ type: "upcoming_events", size: "md" });
  }

  if (ops.has("tables") || ops.has("service_requests")) {
    navigation.push({
      key: "tables",
      label: "QR & Tables",
      href: "/app/qr",
      group: "OPERATIONS",
      entitlement: "qr_enabled",
    });
    navigation.push({
      key: "service_requests",
      label: "Service Requests",
      href: "/app/service-requests",
      group: "OPERATIONS",
      entitlement: "table_service_enabled",
    });
    widgets.push({ type: "open_service_requests", size: "sm" });
    widgets.push({ type: "qr_scans", size: "sm" });
  }

  if (ops.has("leads") || ops.has("customers") || ops.has("feedback")) {
    navigation.push({
      key: "customers",
      label: terminology.customer
        ? `${terminology.customer[0]!.toUpperCase()}${terminology.customer.slice(1)}s`
        : "Customers",
      href: "/app/customers",
      group: "CUSTOMERS",
      entitlement: "customers_enabled",
    });
  }

  navigation.push(
    {
      key: "analytics",
      label: "Analytics",
      href: "/app/analytics",
      group: "INSIGHTS",
      entitlement: "basic_analytics_enabled",
    },
    {
      key: "loyalty",
      label: "Loyalty",
      href: "/app/loyalty",
      group: "GROWTH",
      entitlement: "loyalty_enabled",
    },
    {
      key: "campaigns",
      label: "Campaigns",
      href: "/app/campaigns",
      group: "GROWTH",
      entitlement: "campaigns_enabled",
    },
    {
      key: "automation",
      label: "Automation",
      href: "/app/automation",
      group: "GROWTH",
      entitlement: "automation_enabled",
    },
    { key: "team", label: "Team", href: "/app/team", group: "MANAGEMENT" },
    {
      key: "locations",
      label: terminology.location ?? "Locations",
      href: "/app/locations",
      group: "MANAGEMENT",
    },
    { key: "billing", label: "Billing", href: "/app/billing", group: "ACCOUNT" },
    { key: "support", label: "Support", href: "/app/support", group: "ACCOUNT" },
    { key: "settings", label: "Settings", href: "/app/settings", group: "ACCOUNT" },
  );

  // Prioritize widgets from morning priorities
  if (input.morningPriorities.includes("reservations")) {
    widgets.unshift({ type: "bookings_today", size: "lg" });
  }

  return { navigation, widgets, quickActions, terminology };
}

export function filterNavigationByEntitlements(
  navigation: NavItem[],
  enabledFeatures: Set<string>,
): NavItem[] {
  return navigation.filter((item) => {
    if (!item.entitlement) return true;
    return enabledFeatures.has(item.entitlement);
  });
}
