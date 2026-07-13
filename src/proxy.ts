import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { guardPortal, hasAuthCookie, roleHome } from "@/lib/auth/route-guards";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh the auth session.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const role = (user?.app_metadata?.role as string | undefined) ?? undefined;

  // API routes: refresh the session only, never redirect.
  if (pathname.startsWith("/api/")) {
    return response;
  }

  // Authenticated users should not land on auth entry pages.
  const isAuthEntry =
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname === "/forgot-password";

  if (user && isAuthEntry) {
    return NextResponse.redirect(new URL(role ? roleHome(role) : "/", request.url));
  }

  // Coarse role-aware portal guard (optimistic routing only).
  // Real authorization stays server-side via getAppUser / requireRole.
  const portalRedirect = guardPortal(pathname, user ? { role } : null);
  if (portalRedirect) {
    if (portalRedirect === "/login" && hasAuthCookie(request)) {
      return NextResponse.redirect(new URL("/session-expired", request.url));
    }
    return NextResponse.redirect(new URL(portalRedirect, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|serwist|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
