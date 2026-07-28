/** Product policy: no public registration endpoints. */
export const PUBLIC_AUTH_ROUTES = [
  "/login",
  "/forgot-password",
  "/invite",
] as const;

export const FORBIDDEN_PUBLIC_AUTH_ROUTES = [
  "/signup",
  "/register",
  "/sign-up",
  "/create-account",
  "/create-organization",
  "/create-workspace",
  "/trial",
  "/start-trial",
] as const;

export function isForbiddenPublicAuthPath(pathname: string): boolean {
  const normalized = pathname.toLowerCase().replace(/\/+$/, "") || "/";
  return FORBIDDEN_PUBLIC_AUTH_ROUTES.some(
    (route) => normalized === route || normalized.startsWith(`${route}/`),
  );
}
