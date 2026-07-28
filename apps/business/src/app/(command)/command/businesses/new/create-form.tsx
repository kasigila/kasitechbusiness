"use client";

import { useActionState } from "react";
import { Button, Field, Input } from "@kasitech/ui";
import {
  createBusinessAction,
  type CreateBusinessState,
} from "../actions";

const initial: CreateBusinessState = {};

const industries = [
  { value: "hospitality", label: "Hospitality" },
  { value: "beauty_wellness", label: "Beauty & Wellness" },
  { value: "retail", label: "Retail" },
  { value: "tourism", label: "Tourism" },
  { value: "professional_services", label: "Professional Services" },
  { value: "other", label: "Other" },
];

const plans = ["LAUNCH", "GROWTH", "PRO", "SCALE", "ENTERPRISE"] as const;

export function CreateBusinessForm() {
  const [state, action, pending] = useActionState(createBusinessAction, initial);

  return (
    <form action={action} className="grid gap-8">
      {state.error ? (
        <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100" role="alert">
          {state.error}
        </p>
      ) : null}

      <section className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-lg font-semibold text-white">Business information</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Legal name" htmlFor="legalName" error={state.fieldErrors?.legalName?.[0]}>
            <Input id="legalName" name="legalName" required className="bg-white text-[var(--kb-ink)]" />
          </Field>
          <Field label="Display name" htmlFor="displayName" error={state.fieldErrors?.displayName?.[0]}>
            <Input id="displayName" name="displayName" required className="bg-white text-[var(--kb-ink)]" />
          </Field>
          <Field label="Business slug" htmlFor="slug" error={state.fieldErrors?.slug?.[0]} hint="lido-slipway">
            <Input id="slug" name="slug" required className="bg-white text-[var(--kb-ink)]" />
          </Field>
          <Field label="Primary industry" htmlFor="primaryIndustry">
            <select
              id="primaryIndustry"
              name="primaryIndustry"
              required
              className="kb-input bg-white text-[var(--kb-ink)]"
              defaultValue="hospitality"
            >
              {industries.map((i) => (
                <option key={i.value} value={i.value}>
                  {i.label}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Capabilities"
            htmlFor="capabilities"
            hint="Comma-separated: restaurant, events, appointments"
          >
            <Input
              id="capabilities"
              name="capabilities"
              placeholder="restaurant, bar, events"
              className="bg-white text-[var(--kb-ink)]"
            />
          </Field>
          <Field label="Country" htmlFor="country">
            <Input id="country" name="country" defaultValue="TZ" className="bg-white text-[var(--kb-ink)]" />
          </Field>
          <Field label="Currency" htmlFor="currency">
            <Input id="currency" name="currency" defaultValue="TZS" className="bg-white text-[var(--kb-ink)]" />
          </Field>
          <Field label="Timezone" htmlFor="timezone">
            <Input
              id="timezone"
              name="timezone"
              defaultValue="Africa/Dar_es_Salaam"
              className="bg-white text-[var(--kb-ink)]"
            />
          </Field>
        </div>
        <Field label="Description" htmlFor="description">
          <textarea
            id="description"
            name="description"
            rows={3}
            className="kb-input bg-white text-[var(--kb-ink)]"
          />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Primary address" htmlFor="primaryAddress">
            <Input id="primaryAddress" name="primaryAddress" className="bg-white text-[var(--kb-ink)]" />
          </Field>
          <Field label="Location name (optional)" htmlFor="locationName">
            <Input id="locationName" name="locationName" placeholder="Main branch" className="bg-white text-[var(--kb-ink)]" />
          </Field>
          <Field label="Phone" htmlFor="primaryPhone">
            <Input id="primaryPhone" name="primaryPhone" className="bg-white text-[var(--kb-ink)]" />
          </Field>
          <Field label="WhatsApp" htmlFor="whatsapp">
            <Input id="whatsapp" name="whatsapp" className="bg-white text-[var(--kb-ink)]" />
          </Field>
          <Field label="Email" htmlFor="email">
            <Input id="email" name="email" type="email" className="bg-white text-[var(--kb-ink)]" />
          </Field>
          <Field label="Existing website" htmlFor="existingWebsite">
            <Input id="existingWebsite" name="existingWebsite" type="url" className="bg-white text-[var(--kb-ink)]" />
          </Field>
          <Field label="Instagram" htmlFor="instagram">
            <Input id="instagram" name="instagram" className="bg-white text-[var(--kb-ink)]" />
          </Field>
          <Field label="Accent color" htmlFor="accentColor">
            <Input id="accentColor" name="accentColor" placeholder="#0B3D2E" className="bg-white text-[var(--kb-ink)]" />
          </Field>
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-lg font-semibold text-white">Commercial</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Plan" htmlFor="planKey">
            <select
              id="planKey"
              name="planKey"
              required
              className="kb-input bg-white text-[var(--kb-ink)]"
              defaultValue="GROWTH"
            >
              {plans.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Billing frequency" htmlFor="billingFrequency">
            <select
              id="billingFrequency"
              name="billingFrequency"
              className="kb-input bg-white text-[var(--kb-ink)]"
              defaultValue="MONTHLY"
            >
              <option value="MONTHLY">Monthly</option>
              <option value="YEARLY">Yearly</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </Field>
          <Field label="Implementation fee (TZS)" htmlFor="implementationFeeMinor">
            <Input
              id="implementationFeeMinor"
              name="implementationFeeMinor"
              type="number"
              min={0}
              defaultValue={0}
              className="bg-white text-[var(--kb-ink)]"
            />
          </Field>
          <Field label="Monthly subscription override (optional)" htmlFor="monthlySubscriptionMinor">
            <Input
              id="monthlySubscriptionMinor"
              name="monthlySubscriptionMinor"
              type="number"
              min={0}
              className="bg-white text-[var(--kb-ink)]"
            />
          </Field>
          <Field label="Billing start" htmlFor="billingStartDate">
            <Input id="billingStartDate" name="billingStartDate" type="date" className="bg-white text-[var(--kb-ink)]" />
          </Field>
          <Field label="Contract start" htmlFor="contractStartDate">
            <Input id="contractStartDate" name="contractStartDate" type="date" className="bg-white text-[var(--kb-ink)]" />
          </Field>
          <Field label="Payment status" htmlFor="paymentStatus">
            <select
              id="paymentStatus"
              name="paymentStatus"
              className="kb-input bg-white text-[var(--kb-ink)]"
              defaultValue="PENDING"
            >
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
            </select>
          </Field>
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-lg font-semibold text-white">Owner</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Owner name" htmlFor="ownerName" error={state.fieldErrors?.ownerName?.[0]}>
            <Input id="ownerName" name="ownerName" required className="bg-white text-[var(--kb-ink)]" />
          </Field>
          <Field label="Owner email" htmlFor="ownerEmail" error={state.fieldErrors?.ownerEmail?.[0]}>
            <Input id="ownerEmail" name="ownerEmail" type="email" required className="bg-white text-[var(--kb-ink)]" />
          </Field>
          <Field label="Owner phone" htmlFor="ownerPhone">
            <Input id="ownerPhone" name="ownerPhone" className="bg-white text-[var(--kb-ink)]" />
          </Field>
        </div>
      </section>

      <Button type="submit" loading={pending} className="justify-self-start bg-[var(--kb-green)] text-[var(--kb-ink)]">
        Create Business
      </Button>
    </form>
  );
}
