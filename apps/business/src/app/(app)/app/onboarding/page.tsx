import type { Metadata } from "next";
import Link from "next/link";
import { Badge, PageHeader } from "@kasitech/ui";
import { requireActor } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Onboarding" };

const TASKS = [
  { title: "Complete business profile", done: true, href: "/app/settings" },
  { title: "Complete discovery questionnaire", done: false, href: "/app/discovery" },
  { title: "Upload logo & brand assets", done: false, href: "/app/website" },
  { title: "Provide menu / services", done: false, href: "/app/catalog" },
  { title: "Confirm contact details & hours", done: false, href: "/app/settings" },
  { title: "Review website draft", done: false, href: "/app/website" },
  { title: "Complete training", done: false, href: "/app/support" },
];

export default async function OnboardingPage() {
  await requireActor();
  const done = TASKS.filter((t) => t.done).length;
  const percent = Math.round((done / TASKS.length) * 100);

  return (
    <div>
      <PageHeader
        title="Welcome to KasiTech Business"
        description="Implementation progress — you will not see empty operational modules before they are configured."
      />

      <div className="mb-6 rounded-2xl border border-[var(--kb-border)] bg-[var(--kb-surface)] p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="font-medium">Progress</p>
          <Badge tone="warning">{percent}%</Badge>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--kb-surface-2)]">
          <div
            className="h-full rounded-full bg-[var(--kb-green-strong)]"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <ul className="space-y-3">
        {TASKS.map((task) => (
          <li
            key={task.title}
            className="flex flex-col gap-3 rounded-2xl border border-[var(--kb-border)] bg-[var(--kb-surface)] p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium">{task.title}</p>
              <p className="text-sm text-[var(--kb-muted)]">
                {task.done ? "Completed" : "Waiting on you"}
              </p>
            </div>
            <Link
              href={task.href}
              className={task.done ? "kb-btn kb-btn-ghost" : "kb-btn kb-btn-primary"}
            >
              {task.done ? "View" : "Start"}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
