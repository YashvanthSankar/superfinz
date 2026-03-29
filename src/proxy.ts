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

  // Not logged in — redirect to login
  if (!session) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // Logged in, skip login page
  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Not onboarded — force to onboarding
  if (!session.user.onboarded && !pathname.startsWith("/onboarding")) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  // Already onboarded — block re-entering onboarding
  if (session.user.onboarded && pathname.startsWith("/onboarding")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

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
