"use client";

import { useState } from "react";

const SHARE_TITLE = "Laporan Pengecekan Kebersihan – Villa Hamsa";
const SHARE_TEXT = "Laporan pengecekan kebersihan Villa Hamsa:";

export default function ShareButtons({
  url,
  size = "lg",
}: {
  url: string;
  size?: "sm" | "lg";
}) {
  const [copied, setCopied] = useState(false);
  const pad = size === "lg" ? "min-h-12 px-4" : "min-h-11 px-3 text-sm";

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Salin link ini:", url);
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function share() {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: SHARE_TITLE, text: SHARE_TEXT, url });
      } catch {
        // dibatalkan pengguna
      }
    } else {
      await copy();
    }
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={share}
        className={`flex-1 rounded-xl bg-emerald-600 font-semibold text-white active:scale-[0.98] ${pad}`}
      >
        Bagikan
      </button>
      <button
        type="button"
        onClick={copy}
        className={`flex-1 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 active:scale-[0.98] ${pad}`}
      >
        {copied ? "Tersalin ✓" : "Salin Link"}
      </button>
    </div>
  );
}
