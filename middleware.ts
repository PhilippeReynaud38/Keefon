


import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = url.pathname;

  // On ne touche qu'aux pages /rencontres/*
  if (pathname.startsWith("/rencontres/")) {
    const lower = pathname.toLowerCase();

    // Si quelqu'un arrive avec /rencontres/Rennes, /Rencontres/Paris, etc.
    if (pathname !== lower) {
      const redirectUrl = url.clone();
      redirectUrl.pathname = lower;
      return NextResponse.redirect(redirectUrl, 308);
    }
  }

  return NextResponse.next();
}



export const config = {
  matcher: ["/rencontres/:path*"],
};
