"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Button, PageHeader } from "@kasitech/ui";
import { recommendWorkspace } from "@kasitech/workspace";

const SELLS = [
  "products",
  "services",
  "food",
  "drinks",
  "appointments",
  "reservations",
  "experiences",
  "packages",
] as const;

const OPS = [
  "bookings",
  "appointments",
  "reservations",
  "menu",
  "events",
  "tables",
  "customers",
  "leads",
  "feedback",
] as const;

const PRIORITIES = [
  "reservations",
  "appointments",
  "service_requests",
  "sales",
  "staff",
  "website_traffic",
] as const;

export default function DiscoveryPage() {
  const [sells, setSells] = useState<string[]>(["food", "drinks"]);
  const [ops, setOps] = useState<string[]>(["reservations", "tables", "events"]);
  const [priorities, setPriorities] = useState<string[]>(["reservations"]);
  const [pain, setPain] = useState("Manual reservation confirmations on WhatsApp");
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const recommendation = useMemo(
    () =>
      recommendWorkspace({
        industry: "hospitality",
        sells,
        operations: ops,
        morningPriorities: priorities,
      }),
    [sells, ops, priorities],
  );

  function toggle(list: string[], value: string, setter: (v: string[]) => void) {
    setter(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  }

  return (
    <div>
      <PageHeader
        title="Business Discovery"
        description="Workspaces are based on how you operate — not only your industry. Answers stay structured for KasiTech review."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[var(--kb-border)] bg-[var(--kb-surface)] p-5">
          <h2 className="font-semibold">What do you sell?</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {SELLS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => toggle(sells, item, setSells)}
                className={`rounded-full border px-3 py-1.5 text-sm ${
                  sells.includes(item)
                    ? "border-[var(--kb-ink)] bg-[var(--kb-ink)] text-[var(--kb-ivory)]"
                    : "border-[var(--kb-border)]"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <h2 className="mt-6 font-semibold">What do you manage daily?</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {OPS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => toggle(ops, item, setOps)}
                className={`rounded-full border px-3 py-1.5 text-sm ${
                  ops.includes(item)
                    ? "border-[var(--kb-ink)] bg-[var(--kb-ink)] text-[var(--kb-ivory)]"
                    : "border-[var(--kb-border)]"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <h2 className="mt-6 font-semibold">
            Morning priorities — what must you know first?
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {PRIORITIES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => toggle(priorities, item, setPriorities)}
                className={`rounded-full border px-3 py-1.5 text-sm ${
                  priorities.includes(item)
                    ? "border-[var(--kb-ink)] bg-[var(--kb-ink)] text-[var(--kb-ivory)]"
                    : "border-[var(--kb-border)]"
                }`}
              >
                {item.replaceAll("_", " ")}
              </button>
            ))}
          </div>

          <label className="mt-6 block">
            <span className="kb-label">Biggest frustration technology should improve</span>
            <textarea
              className="kb-input mt-1"
              rows={3}
              value={pain}
              onChange={(e) => setPain(e.target.value)}
            />
          </label>

          <Button
            className="mt-4"
            loading={pending}
            onClick={() =>
              startTransition(async () => {
                await new Promise((r) => setTimeout(r, 400));
                setSaved(true);
              })
            }
          >
            Save discovery answers
          </Button>
          {saved ? (
            <p className="mt-2 text-sm text-[var(--kb-success)]" role="status">
              Saved for KasiTech review. Recommendation stays unpublished until admin accepts.
            </p>
          ) : null}
        </section>

        <section className="rounded-2xl border border-[var(--kb-border)] bg-[var(--kb-surface)] p-5">
          <h2 className="font-semibold">Recommended workspace (draft)</h2>
          <p className="mt-1 text-sm text-[var(--kb-muted)]">
            Not live until a KasiTech administrator publishes it.
          </p>
          <div className="mt-4">
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--kb-muted)]">
              Terminology
            </p>
            <ul className="mt-2 space-y-1 text-sm">
              {Object.entries(recommendation.terminology).map(([k, v]) => (
                <li key={k}>
                  {k} → <strong>{v}</strong>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-4">
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--kb-muted)]">
              Modules
            </p>
            <ul className="mt-2 space-y-1 text-sm">
              {recommendation.navigation.map((n) => (
                <li key={n.key}>{n.label}</li>
              ))}
            </ul>
          </div>
          <Link href="/command/businesses" className="kb-btn kb-btn-secondary mt-5 inline-flex">
            Admin reviews in Command
          </Link>
        </section>
      </div>
    </div>
  );
}
