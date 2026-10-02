"use client";

import { useEffect, useState } from "react";

export default function PhotoGrid({ photos }: { photos: string[] }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setActive(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active]);

  if (photos.length === 0) return null;
  return (
    <>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {photos.map((url) => (
          <button
            key={url}
            type="button"
            onClick={() => setActive(url)}
            className="aspect-square overflow-hidden rounded-lg bg-slate-100"
          >
            <img src={url} alt="Foto bukti" loading="lazy" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
      {active && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-2"
          onClick={() => setActive(null)}
        >
          <button
            type="button"
            aria-label="Tutup"
            onClick={() => setActive(null)}
            className="absolute right-3 top-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-2xl text-white"
          >
            ×
          </button>
          <img src={active} alt="Foto bukti" className="max-h-full max-w-full object-contain" />
        </div>
      )}
    </>
  );
}
