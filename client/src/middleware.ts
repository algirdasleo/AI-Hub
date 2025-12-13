import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const path = url.pathname;

  if (path.startsWith("/_next") || path.startsWith("/api") || path.includes(".")) {
    return NextResponse.next();
  }

  const hasAccessToken = request.cookies.has("sb-access-token");
  const isAuthenticated = hasAccessToken;

  const isAuthPage = path.startsWith("/auth");
  const isPublicHomePage = path === "/";
  const isAppRoute =
    path.startsWith("/dashboard") ||
    path.startsWith("/chat") ||
    path.startsWith("/comparison") ||
    path.startsWith("/projects") ||
    path.startsWith("/tracking") ||
    path.startsWith("/settings");

  // If user is authenticated, allow access to any route
  if (isAuthenticated) {
    return NextResponse.next();
  }

  // Allow public routes
  if (isPublicHomePage || isAuthPage) {
    return NextResponse.next();
  }

  // For app routes without authentication, redirect to login
  if (isAppRoute) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}
