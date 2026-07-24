import type { Metadata } from "next";
import { Badge, Button, PageHeader } from "@kasitech/ui";
import { requireActor } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Menu" };

const ITEMS = [
  { name: "Grilled Prawns", price: 28000, status: "AVAILABLE", category: "Mains" },
  { name: "Coconut Rice", price: 12000, status: "AVAILABLE", category: "Sides" },
  { name: "Passion Mojito", price: 10000, status: "UNAVAILABLE", category: "Drinks" },
  { name: "Bottomless Mimosas", price: 45000, status: "AVAILABLE", category: "Brunch" },
];

export default async function CatalogPage() {
  await requireActor();

  return (
    <div>
      <PageHeader
        title="Menu"
        description="Catalog engine with hospitality terminology. Prices publish to the public site after you publish."
        actions={<Button>+ Add item</Button>}
      />
      <div className="overflow-x-auto rounded-2xl border border-[var(--kb-border)] bg-[var(--kb-surface)]">
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
            {ITEMS.map((item) => (
              <tr key={item.name} className="border-b border-[var(--kb-border)] last:border-0">
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3">{item.category}</td>
                <td className="px-4 py-3">
                  TSh {item.price.toLocaleString("en-TZ")}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={item.status === "AVAILABLE" ? "success" : "warning"}>
                    {item.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
