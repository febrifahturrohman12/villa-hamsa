import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

// Lindungi semua halaman kecuali /login, /r/*, aset Next & file statis.
export async function proxy(request: NextRequest) {
  const ok = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (ok) return NextResponse.next();

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Belum login" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/((?!_next/|favicon\\.ico$|login(?:/|$)|r/|.*\\.[a-zA-Z0-9]+$).*)"],
};
