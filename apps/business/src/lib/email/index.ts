/**
 * Transactional email abstraction.
 * Uses Resend when RESEND_API_KEY is set; otherwise logs / records preview skip.
 */

export type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  businessId?: string | null;
  templateKey?: string;
};

export type SendEmailResult = {
  status: "SENT" | "SKIPPED_PREVIEW" | "FAILED";
  messageId?: string;
  error?: string;
};

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.EMAIL_FROM ||
    "KasiTech Business <noreply@kasitechinnovations.com>";

  if (!apiKey) {
    console.info("[email:preview-skip]", {
      to: input.to,
      subject: input.subject,
      templateKey: input.templateKey,
    });
    return { status: "SKIPPED_PREVIEW" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        text: input.text,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { status: "FAILED", error: body.slice(0, 500) };
    }

    const json = (await res.json()) as { id?: string };
    return { status: "SENT", messageId: json.id };
  } catch (error) {
    return {
      status: "FAILED",
      error: error instanceof Error ? error.message : "send_failed",
    };
  }
}

export function invitationEmailText(input: {
  businessName: string;
  inviteUrl: string;
  ownerName?: string;
}): string {
  return [
    `Karibu to KasiTech Business.`,
    ``,
    input.ownerName
      ? `Hi ${input.ownerName},`
      : `Hello,`,
    ``,
    `You have been invited to manage ${input.businessName}.`,
    `Accept your invitation (no public signup):`,
    input.inviteUrl,
    ``,
    `If you did not expect this, ignore this email.`,
    ``,
    `— KasiTech Innovations`,
  ].join("\n");
}
