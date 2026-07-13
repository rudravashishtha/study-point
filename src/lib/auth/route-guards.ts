import type { NextRequest } from "next/server";

export type AppRole = "ADMIN" | "TEACHER" | "STUDENT";

export function roleHome(role?: string | null): string {
  switch (role) {
    case "STUDENT":
      return "/student";
    case "TEACHER":
      return "/teacher";
    case "ADMIN":
      return "/admin";
    default:
      return "/login";
  }
}

export function hasAuthCookie(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("auth"));
}

const PORTALS: { prefix: string; role: AppRole }[] = [
  { prefix: "/admin", role: "ADMIN" },
  { prefix: "/student", role: "STUDENT" },
  { prefix: "/teacher", role: "TEACHER" },
];

/**
 * Coarse, optimistic portal guard used by proxy.ts for routing only.
 * Returns a redirect target path, or undefined to allow the request.
 * Real authorization stays server-side via getAppUser / requireRole.
 */
export function guardPortal(
  pathname: string,
  user: { role?: string | null } | null,
): string | undefined {
  for (const portal of PORTALS) {
    if (pathname === portal.prefix || pathname.startsWith(portal.prefix + "/")) {
      if (!user) {
        return "/login";
      }
      if (user.role !== portal.role) {
        return roleHome(user.role);
      }
      return undefined;
    }
  }
  return undefined;
}
