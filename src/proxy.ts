import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Not logged in → protect dashboard
  if (!session && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (session) {
    // Logged in but not onboarded → force onboarding (except if already there)
    if (!session.user.onboarded && pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
    // Onboarded → skip onboarding
    if (session.user.onboarded && pathname.startsWith("/onboarding")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    // Logged in → skip login page
    if (pathname === "/login") {
      return NextResponse.redirect(
        new URL(session.user.onboarded ? "/dashboard" : "/onboarding", req.url)
      );
    }
  }
});

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/onboarding/:path*"],
};
