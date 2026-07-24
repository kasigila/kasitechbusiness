"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button, Field, Input, PageHeader } from "@kasitech/ui";

export default function WebsiteEditorPage() {
  const [headline, setHeadline] = useState("Welcome to Lido Slipway");
  const [subheadline, setSubheadline] = useState(
    "Waterfront dining, events, and evenings by the bay.",
  );
  const [cta, setCta] = useState("Reserve a table");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div>
      <PageHeader
        title="Website editor"
        description="Structured Hero section — no arbitrary HTML, CSS, or JavaScript."
        actions={
          <Link href="/app/website" className="kb-btn kb-btn-ghost">
            Back
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          className="grid gap-4 rounded-2xl border border-[var(--kb-border)] bg-[var(--kb-surface)] p-5"
          onSubmit={(e) => {
            e.preventDefault();
            startTransition(async () => {
              await new Promise((r) => setTimeout(r, 350));
              setStatus("DRAFT");
              setMessage("Draft saved. Public site still shows last published version.");
            });
          }}
        >
          <h2 className="font-semibold">Hero section</h2>
          <Field label="Headline" htmlFor="headline">
            <Input
              id="headline"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
            />
          </Field>
          <Field label="Subheadline" htmlFor="subheadline">
            <Input
              id="subheadline"
              value={subheadline}
              onChange={(e) => setSubheadline(e.target.value)}
            />
          </Field>
          <Field label="Primary CTA label" htmlFor="cta">
            <Input id="cta" value={cta} onChange={(e) => setCta(e.target.value)} />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" loading={pending} variant="secondary">
              Save Draft
            </Button>
            <Button
              type="button"
              loading={pending}
              onClick={() =>
                startTransition(async () => {
                  await new Promise((r) => setTimeout(r, 450));
                  setStatus("PUBLISHED");
                  setMessage(
                    "Published. Version recorded. Public API will serve this content after cache refresh.",
                  );
                })
              }
            >
              Publish
            </Button>
          </div>
          {message ? (
            <p className="text-sm text-[var(--kb-success)]" role="status">
              {message} Current status: {status}.
            </p>
          ) : null}
        </form>

        <div className="overflow-hidden rounded-2xl border border-[var(--kb-border)] bg-[var(--kb-ink)] p-8 text-[var(--kb-ivory)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/50">
            Preview
          </p>
          <h2 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-[-0.04em]">
            {headline}
          </h2>
          <p className="mt-3 max-w-md text-white/70">{subheadline}</p>
          <button
            type="button"
            className="mt-6 rounded-full bg-[var(--kb-green)] px-5 py-3 text-sm font-semibold text-[var(--kb-ink)]"
          >
            {cta}
          </button>
        </div>
      </div>
    </div>
  );
}
