import { err, ok, platformError, type Result } from "@kasitech/validation";
import { isUsingPreviewData } from "@/lib/auth/guards";

export type ActionMessage = {
  ok: boolean;
  message: string;
  preview?: boolean;
  data?: Record<string, unknown>;
};

export function previewSuccess(message: string, data?: Record<string, unknown>): ActionMessage {
  return { ok: true, message, preview: true, data };
}

export function liveSuccess(message: string, data?: Record<string, unknown>): ActionMessage {
  return { ok: true, message, preview: false, data };
}

export function fail(message: string): ActionMessage {
  return { ok: false, message };
}

export function usingPreview(): boolean {
  return isUsingPreviewData();
}

export function resultToMessage(
  result: Result<unknown>,
  successMessage: string,
): ActionMessage {
  if (!result.ok) {
    return fail(result.error.message);
  }
  return liveSuccess(successMessage);
}

export function requireString(value: FormDataEntryValue | null, label: string): Result<string> {
  const text = String(value ?? "").trim();
  if (!text) {
    return err(platformError("VALIDATION_ERROR", `${label} is required.`));
  }
  return ok(text);
}
