import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Unauthenticated → protect dashboard + onboarding
  if (!session) {
    if (pathname.startsWith("/dashboard") || pathname === "/onboarding") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return;
  }

  // Authenticated → skip login page
  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
});

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/onboarding"],
};
