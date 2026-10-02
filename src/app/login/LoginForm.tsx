"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

export default function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className="space-y-4">
      <input
        name="pin"
        type="password"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="current-password"
        autoFocus
        required
        placeholder="PIN"
        aria-label="PIN"
        className="h-16 w-full rounded-2xl border border-slate-300 bg-white text-center text-3xl tracking-[0.5em] outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
      />
      {state.error && (
        <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="h-14 w-full rounded-2xl bg-emerald-600 text-lg font-semibold text-white active:scale-[0.98] disabled:opacity-60"
      >
        {pending ? "Memeriksa…" : "Masuk"}
      </button>
    </form>
  );
}
