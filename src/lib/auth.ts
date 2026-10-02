import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionToken } from "./session";

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

/** Dipakai di halaman & server action: redirect ke /login jika belum login. */
export async function requireSession(): Promise<void> {
  if (!(await isAuthenticated())) redirect("/login");
}
