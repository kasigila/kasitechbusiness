import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isForbiddenPublicAuthPath } from "@kasitech/auth/policy";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Allow local UI development without Supabase configured.
  if (!url || !key) {
    return enforceRoutePolicy(request, supabaseResponse, null);
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

  return enforceRoutePolicy(request, supabaseResponse, user?.id ?? null);
}

function enforceRoutePolicy(
  request: NextRequest,
  response: NextResponse,
  userId: string | null,
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
    pathname.startsWith("/invite/");

  const isProtected =
    pathname.startsWith("/app") || pathname.startsWith("/command");

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
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    return NextResponse.redirect(login);
  }

  // Soft allow: public auth pages when anonymous
  if (!userId && isPublicAuth) {
    return response;
  }

  return response;
}
