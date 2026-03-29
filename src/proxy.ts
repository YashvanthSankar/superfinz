import { auth } from "@/auth";
import { NextResponse } from "next/server";

const PROTECTED_API = [
  "/api/transactions",
  "/api/budgets",
  "/api/goals",
  "/api/ai-check",
  "/api/chat",
  "/api/heatmap",
  "/api/profile",
  "/api/news",
];

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isProtectedApi = PROTECTED_API.some((p) => pathname.startsWith(p));

  // API routes: return 401 JSON, never redirect
  if (isProtectedApi) {
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Allow login page when logged out (prevents /login -> /login redirect loop)
  if (pathname === "/login") {
    return NextResponse.next();
  }

  // Not logged in — redirect to login
  if (!session) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // Onboarding redirects are handled in route/layout logic using DB-backed session checks.
  // Keeping this out of proxy avoids production redirect loops from stale JWT fields.

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/login",
    "/api/transactions/:path*",
    "/api/budgets/:path*",
    "/api/goals/:path*",
    "/api/ai-check/:path*",
    "/api/chat/:path*",
    "/api/heatmap/:path*",
    "/api/profile/:path*",
    "/api/news/:path*",
  ],
};
