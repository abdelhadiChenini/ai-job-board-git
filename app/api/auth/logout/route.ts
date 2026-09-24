import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE_PREFIX = /^(__Secure-|__Host-)?next-auth\./;

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ ok: true });

  for (const cookie of request.cookies.getAll()) {
    if (AUTH_COOKIE_PREFIX.test(cookie.name)) {
      response.cookies.set({
        name: cookie.name,
        value: "",
        maxAge: 0,
        path: "/",
      });
    }
  }

  return response;
}

export async function GET() {
  const origin = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  return NextResponse.redirect(new URL("/", origin));
}