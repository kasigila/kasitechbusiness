import type { Metadata } from "next";
import { Badge, PageHeader } from "@kasitech/ui";
import { requireActor } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "QR & Tables" };

const QRS = [
  { label: "Table 12", token: "qr_8f3a…", type: "table", scans: 42, status: "ACTIVE" },
  { label: "Main Menu", token: "qr_1c90…", type: "menu", scans: 118, status: "ACTIVE" },
  { label: "Mimosas Event", token: "qr_77ab…", type: "event", scans: 51, status: "ACTIVE" },
];

export default async function QrPage() {
  await requireActor();

  return (
    <div>
      <PageHeader
        title="QR & Tables"
        description="Opaque public tokens — never sequential database IDs. Growth+ entitlement."
      />
      <div className="overflow-x-auto rounded-2xl border border-[var(--kb-border)] bg-[var(--kb-surface)]">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--kb-border)] text-[var(--kb-muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">Label</th>
              <th className="px-4 py-3 font-medium">Destination</th>
              <th className="px-4 py-3 font-medium">Token</th>
              <th className="px-4 py-3 font-medium">Scans</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {QRS.map((qr) => (
              <tr key={qr.token} className="border-b border-[var(--kb-border)] last:border-0">
                <td className="px-4 py-3 font-medium">{qr.label}</td>
                <td className="px-4 py-3">{qr.type}</td>
                <td className="px-4 py-3 font-mono text-xs">{qr.token}</td>
                <td className="px-4 py-3">{qr.scans}</td>
                <td className="px-4 py-3">
                  <Badge tone="success">{qr.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
