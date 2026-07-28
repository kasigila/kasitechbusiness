import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isForbiddenPublicAuthPath } from "@kasitech/auth/policy";

function isPreviewUiEnabled(): boolean {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ALLOW_PREVIEW_UI !== "true"
  ) {
    return false;
  }
  return process.env.NEXT_PUBLIC_PREVIEW_UI === "true";
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const preview = isPreviewUiEnabled();

  // Allow UI preview without Supabase configured.
  if (!url || !key) {
    return enforceRoutePolicy(request, supabaseResponse, null, preview);
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: {
          name: string;
          value: string;
          options?: Record<string, unknown>;
        }[],
      ) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return enforceRoutePolicy(
    request,
    supabaseResponse,
    user?.id ?? null,
    preview,
  );
}

function enforceRoutePolicy(
  request: NextRequest,
  response: NextResponse,
  userId: string | null,
  preview: boolean,
) {
  const { pathname } = request.nextUrl;

  if (isForbiddenPublicAuthPath(pathname)) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.search = "";
    return NextResponse.redirect(login);
  }

  const isPublicAuth =
    pathname === "/login" ||
    pathname === "/forgot-password" ||
    pathname === "/preview" ||
    pathname.startsWith("/invite/");

  const isProtected =
    pathname.startsWith("/app") || pathname.startsWith("/command");

  // Preview mode: browse app/command shells without a session.
  if (!userId && isProtected && preview) {
    return response;
  }

  if (!userId && isProtected) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  if (userId && (pathname === "/login" || pathname === "/")) {
    const app = request.nextUrl.clone();
    app.pathname = "/app";
    app.search = "";
    return NextResponse.redirect(app);
  }

  if (!userId && pathname === "/") {
    const dest = request.nextUrl.clone();
    dest.pathname = preview ? "/preview" : "/login";
    return NextResponse.redirect(dest);
  }

  if (!userId && isPublicAuth) {
    return response;
  }

  return response;
}
