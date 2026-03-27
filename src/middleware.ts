import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "@/shared/lib/auth.config";

const { auth } = NextAuth(authConfig);

const roleRouteMap: Record<string, string> = {
  ORGANIZER: "/organizer",
  TABLE_CAPTAIN: "/captain",
  JUDGE: "/judge",
};

const protectedPrefixes = ["/organizer", "/captain", "/judge", "/rules"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const role = req.auth?.user?.role;

  // If not authenticated and trying to access protected routes, redirect to login
  if (!req.auth && protectedPrefixes.some((p) => pathname.startsWith(p))) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If authenticated, enforce role-based access
  if (req.auth && role) {
    const allowedPrefix = roleRouteMap[role];

    // /rules is accessible to all authenticated roles
    if (pathname.startsWith("/rules")) {
      return NextResponse.next();
    }

    // Check if the user is accessing a protected route they shouldn't
    for (const prefix of protectedPrefixes) {
      if (pathname.startsWith(prefix) && prefix !== allowedPrefix) {
        return NextResponse.redirect(new URL(allowedPrefix, req.url));
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login).*)"],
};
