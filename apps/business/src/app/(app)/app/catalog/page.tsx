import type { Metadata } from "next";
import { Badge, PageHeader } from "@kasitech/ui";
import {
  isUsingPreviewData,
  requireTenantContext,
} from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { CatalogForms } from "./catalog-forms";

export const metadata: Metadata = { title: "Menu" };

const PREVIEW_ITEMS = [
  { id: "1", name: "Grilled Prawns", price_minor: 28000, availability: "AVAILABLE", category: "Mains" },
  { id: "2", name: "Coconut Rice", price_minor: 12000, availability: "AVAILABLE", category: "Sides" },
  { id: "3", name: "Passion Mojito", price_minor: 10000, availability: "UNAVAILABLE", category: "Drinks" },
  { id: "4", name: "Bottomless Mimosas", price_minor: 45000, availability: "AVAILABLE", category: "Brunch" },
];

export default async function CatalogPage() {
  const { tenant } = await requireTenantContext();

  let items = PREVIEW_ITEMS;

  if (!isUsingPreviewData()) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("catalog_items")
      .select("id, name, price_minor, availability, catalog_categories(name)")
      .eq("business_id", tenant.businessId)
      .order("display_order");

    items =
      data?.map((row) => {
        const cat = Array.isArray(row.catalog_categories)
          ? row.catalog_categories[0]
          : row.catalog_categories;
        return {
          id: row.id as string,
          name: row.name as string,
          price_minor: (row.price_minor as number) ?? 0,
          availability: row.availability as string,
          category: cat?.name ?? "General",
        };
      }) ?? [];
  }

  return (
    <div>
      <PageHeader
        title="Menu"
        description="Catalog engine with hospitality terminology. Prices publish to the public site after you publish."
      />

      <CatalogForms />

      <div className="mt-6 overflow-x-auto rounded-2xl border border-[var(--kb-border)] bg-[var(--kb-surface)]">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--kb-border)] text-[var(--kb-muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">Item</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Availability</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td className="px-4 py-4 text-[var(--kb-muted)]" colSpan={4}>
                  No items yet — add your first below or above.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-b border-[var(--kb-border)] last:border-0">
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3">{item.category}</td>
                  <td className="px-4 py-3">
                    TSh {item.price_minor.toLocaleString("en-TZ")}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={item.availability === "AVAILABLE" ? "success" : "warning"}>
                      {item.availability}
                    </Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
