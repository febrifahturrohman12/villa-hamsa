"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createReport, type CreateReportState } from "./actions";

const NAME_KEY = "vh_inspector_name";

export default function NewReport() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<CreateReportState, FormData>(createReport, {});
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && nameRef.current && !nameRef.current.value) {
      nameRef.current.value = localStorage.getItem(NAME_KEY) ?? "";
    }
  }, [open]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-16 w-full rounded-2xl bg-emerald-600 text-lg font-bold text-white shadow-sm active:scale-[0.98]"
      >
        + Mulai Pengecekan Baru
      </button>
    );
  }

  return (
    <form
      action={action}
      onSubmit={() => {
        const v = nameRef.current?.value.trim();
        if (v) localStorage.setItem(NAME_KEY, v);
      }}
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <h2 className="text-lg font-bold">Pengecekan Baru</h2>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">Nama inspektor</span>
        <input
          ref={nameRef}
          name="inspectorName"
          required
          maxLength={80}
          autoComplete="name"
          className="h-12 w-full rounded-xl border border-slate-300 px-3 text-base outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">
          Jadwal tamu tiba <span className="text-slate-400">(opsional)</span>
        </span>
        <input
          name="guestArrival"
          type="datetime-local"
          className="h-12 w-full rounded-xl border border-slate-300 px-3 text-base outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
        />
      </label>
      {state.error && (
        <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="min-h-12 flex-1 rounded-xl border border-slate-300 font-semibold"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={pending}
          className="min-h-12 flex-[2] rounded-xl bg-emerald-600 font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Menyiapkan…" : "Mulai"}
        </button>
      </div>
    </form>
  );
}
