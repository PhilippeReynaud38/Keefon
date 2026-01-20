import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const path = url.pathname;

  // On normalise uniquement /rencontres/*
  if (!path.toLowerCase().startsWith("/rencontres")) {
    return NextResponse.next();
  }

  // Supprime les slashs finaux (sauf "/")
  const noTrailing = path !== "/" ? path.replace(/\/+$/, "") : path;

  // Met tout en minuscule
  const normalized = noTrailing.toLowerCase();

  if (normalized !== path) {
    url.pathname = normalized;
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/rencontres/:path*"],
};
