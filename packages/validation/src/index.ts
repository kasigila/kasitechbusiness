import { z } from "zod";

export const PlatformErrorCode = z.enum([
  "UNAUTHENTICATED",
  "UNAUTHORIZED",
  "NOT_FOUND",
  "VALIDATION_ERROR",
  "PLAN_LIMIT_REACHED",
  "FEATURE_NOT_AVAILABLE",
  "CONFLICT",
  "RATE_LIMITED",
  "INTERNAL_ERROR",
]);

export type PlatformErrorCode = z.infer<typeof PlatformErrorCode>;

export type PlatformError = {
  code: PlatformErrorCode;
  message: string;
  details?: unknown;
  errorId?: string;
};

export function platformError(
  code: PlatformErrorCode,
  message: string,
  details?: unknown,
): PlatformError {
  return { code, message, details };
}

/** Cross-tenant and missing private resources share this shape — no existence leak. */
export function notFound(message = "Resource not found"): PlatformError {
  return platformError("NOT_FOUND", message);
}

export function unauthenticated(
  message = "Authentication required",
): PlatformError {
  return platformError("UNAUTHENTICATED", message);
}

export function unauthorized(
  message = "You do not have permission to perform this action",
): PlatformError {
  return platformError("UNAUTHORIZED", message);
}

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: PlatformError };

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function err<T = never>(error: PlatformError): Result<T> {
  return { ok: false, error };
}

export {
  createBusinessSchema,
  DEFAULT_ONBOARDING_TASKS,
  defaultNavigationForIndustry,
  defaultQuickActions,
  type CreateBusinessInput,
} from "./create-business";
