import { NextRequest, NextResponse } from "next/server";

const isProduction = process.env.NODE_ENV === "production";
const sessionCookieName = isProduction
  ? "__Secure-next-auth.session-token"
  : "next-auth.session-token";

export function middleware(req: NextRequest) {
  const sessionToken = req.cookies.get(sessionCookieName)?.value;

  if (!sessionToken) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // TODO: Add specific role validation here if your token stores the user
  // role (e.g., role !== 'ADMIN')

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};