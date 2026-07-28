import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const protectedPrefixes = [
  "/dashboard",
  "/settings",
  "/companies",
  "/jobs",
  "/applications",
  "/contacts",
  "/email-sequences",
  "/cv-library",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/settings/:path*",
    "/companies/:path*",
    "/jobs/:path*",
    "/applications/:path*",
    "/contacts/:path*",
    "/email-sequences/:path*",
    "/cv-library/:path*",
  ],
};
