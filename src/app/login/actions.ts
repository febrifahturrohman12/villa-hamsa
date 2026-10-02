"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, SESSION_MAX_AGE, createSessionToken, safeEqual } from "@/lib/session";

export interface LoginState {
  error?: string;
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const pin = String(formData.get("pin") ?? "").trim();
  const expected = process.env.INSPECTOR_PIN;
  if (!expected || !process.env.SESSION_SECRET) {
    return { error: "Server belum dikonfigurasi (INSPECTOR_PIN / SESSION_SECRET)." };
  }
  if (!pin || !(await safeEqual(pin, expected))) {
    await new Promise((r) => setTimeout(r, 600)); // perlambat tebakan PIN
    return { error: "PIN salah. Coba lagi." };
  }
  const store = await cookies();
  store.set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  redirect("/");
}

export async function logout(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}
