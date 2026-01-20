import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const p = url.pathname;

  // On ne touche qu'à /rencontres/...
  if (!p.startsWith("/rencontres")) return NextResponse.next();

  let n = p;

  // enlever slash final (sauf "/")
  if (n.length > 1 && n.endsWith("/")) n = n.slice(0, -1);

  // lower-case uniquement les segments après "/rencontres"
  const parts = n.split("/");
  if (parts.length > 2) {
    for (let i = 2; i < parts.length; i++) parts[i] = parts[i].toLowerCase();
    n = parts.join("/");
  }

  if (n !== p) {
    url.pathname = n;
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/rencontres/:path*"],
};
