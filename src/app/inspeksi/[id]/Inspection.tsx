"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { groupByArea, type ItemStatus, type ReportItem } from "@/lib/types";
import { removePhoto, saveItem, saveNotes, submitReport } from "./actions";
import { SaveQueue, type SaveState } from "./save-queue";
import ItemRow from "./ItemRow";

interface Props {
  reportId: string;
  inspectorName: string;
  initialItems: ReportItem[];
  initialNotes: string;
}

function isProblem(i: ReportItem): boolean {
  return !i.status || (i.status === "not_ok" && !i.description?.trim());
}

export default function Inspection({ reportId, inspectorName, initialItems, initialNotes }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<ReportItem[]>(initialItems);
  const [notes, setNotes] = useState(initialNotes);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [openAreas, setOpenAreas] = useState<Set<string>>(() => {
    const first = groupByArea(initialItems).find((g) => g.items.some((i) => !i.status));
    return new Set(first ? [first.key] : []);
  });
  const [showProblems, setShowProblems] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(0);

  const [queue] = useState(
    () =>
      new SaveQueue(
        (key, payload) =>
          key === "notes"
            ? saveNotes(reportId, payload.text as string)
            : saveItem(reportId, key.slice(5), payload as { status?: ItemStatus | null; description?: string }),
        setSaveState,
      ),
  );

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (queue.pending) e.preventDefault();
    };
    const onOnline = () => void queue.flush();
    const onHidden = () => {
      if (document.visibilityState === "hidden" && queue.pending) void queue.flush();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onHidden);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onHidden);
      queue.dispose();
    };
  }, [queue]);

  const groups = useMemo(() => groupByArea(items), [items]);
  const total = items.length;
  const checked = items.filter((i) => i.status).length;
  const notOk = items.filter((i) => i.status === "not_ok").length;

  const patchItem = useCallback((id: string, fn: (i: ReportItem) => ReportItem) => {
    setItems((prev) => prev.map((i) => (i.id === id ? fn(i) : i)));
  }, []);

  const onStatus = useCallback(
    (id: string, status: ItemStatus | null) => {
      patchItem(id, (i) => ({ ...i, status }));
      queue.enqueue(`item:${id}`, { status });
    },
    [patchItem, queue],
  );

  const onDescription = useCallback(
    (id: string, text: string) => {
      patchItem(id, (i) => ({ ...i, description: text }));
      queue.enqueue(`item:${id}`, { description: text }, 600);
    },
    [patchItem, queue],
  );

  const onPhotoAdded = useCallback(
    (id: string, url: string) => patchItem(id, (i) => ({ ...i, photos: [...i.photos, url] })),
    [patchItem],
  );

  const onPhotoRemove = useCallback(
    (id: string, url: string) => {
      patchItem(id, (i) => ({ ...i, photos: i.photos.filter((p) => p !== url) }));
      removePhoto(id, url).catch(() => {
        patchItem(id, (i) => ({ ...i, photos: i.photos.includes(url) ? i.photos : [...i.photos, url] }));
        setMessage("Gagal menghapus foto. Coba lagi.");
      });
    },
    [patchItem],
  );

  const onUploading = useCallback((d: number) => setUploading((n) => n + d), []);

  function toggleArea(key: string) {
    setOpenAreas((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function markAllOk(groupItems: ReportItem[]) {
    for (const i of groupItems) if (!i.status) onStatus(i.id, "ok");
  }

  function onNotes(text: string) {
    setNotes(text);
    queue.enqueue("notes", { text }, 600);
  }

  async function onSubmit() {
    setMessage(null);
    if (uploading > 0) {
      setMessage("Tunggu upload foto selesai dulu.");
      return;
    }
    setSubmitting(true);
    const saved = await queue.flush();
    if (!saved) {
      setMessage("Ada perubahan yang belum tersimpan. Periksa koneksi lalu coba lagi.");
      setSubmitting(false);
      return;
    }
    const missing = items.filter((i) => !i.status).length;
    const noDesc = items.filter((i) => i.status === "not_ok" && !i.description?.trim()).length;
    if (missing > 0 || noDesc > 0) {
      setShowProblems(true);
      const parts: string[] = [];
      if (missing > 0) parts.push(`${missing} item belum dicek`);
      if (noDesc > 0) parts.push(`${noDesc} item Tidak Sesuai belum ada deskripsi`);
      setMessage(`Belum lengkap: ${parts.join(", ")}.`);
      const firstGroup = groups.find((g) => g.items.some(isProblem));
      const firstItem = firstGroup?.items.find(isProblem);
      if (firstGroup && firstItem) {
        setOpenAreas((prev) => new Set(prev).add(firstGroup.key));
        setTimeout(() => {
          document.getElementById(`item-${firstItem.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 150);
      }
      setSubmitting(false);
      return;
    }
    try {
      const res = await submitReport(reportId);
      if (!res.ok) {
        setMessage(res.message);
        setSubmitting(false);
        return;
      }
      router.push(`/inspeksi/${reportId}/selesai`);
    } catch {
      setMessage("Gagal mengirim. Periksa koneksi lalu coba lagi.");
      setSubmitting(false);
    }
  }

  const pct = total ? Math.round((checked / total) * 100) : 0;

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-slate-50 pb-44">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 pb-3 pt-3 backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold">
            {checked}/{total} dicek
            {notOk > 0 && <span className="text-rose-600"> · {notOk} tidak sesuai</span>}
          </p>
          <button
            type="button"
            onClick={() => saveState === "error" && void queue.flush()}
            className={`shrink-0 text-xs font-medium ${
              saveState === "error" ? "text-rose-600 underline" : saveState === "saving" ? "text-slate-500" : "text-emerald-600"
            }`}
          >
            {saveState === "saving" && "Menyimpan…"}
            {saveState === "saved" && "Tersimpan ✓"}
            {saveState === "error" && "Gagal menyimpan – coba lagi"}
          </button>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-1 truncate text-xs text-slate-500">Inspektor: {inspectorName}</p>
      </header>

      <main className="space-y-3 px-4 pt-4">
        {groups.map((g) => {
          const done = g.items.filter((i) => i.status).length;
          const bad = g.items.filter((i) => i.status === "not_ok").length;
          const complete = done === g.items.length;
          const open = openAreas.has(g.key);
          return (
            <section key={g.key} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <button
                type="button"
                onClick={() => toggleArea(g.key)}
                aria-expanded={open}
                className="flex min-h-14 w-full items-center gap-2 px-4 py-3 text-left"
              >
                <span className="flex-1 font-bold">{g.name}</span>
                {bad > 0 && (
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                    {bad} ✗
                  </span>
                )}
                {complete ? (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-sm text-white">
                    ✓
                  </span>
                ) : (
                  <span className="text-sm text-slate-500">
                    {done}/{g.items.length}
                  </span>
                )}
                <span className={`text-slate-400 transition ${open ? "rotate-180" : ""}`}>▾</span>
              </button>
              {open && (
                <div className="space-y-3 border-t border-slate-100 bg-slate-50 p-3">
                  {g.note && (
                    <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">ℹ️ {g.note}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => markAllOk(g.items)}
                    disabled={complete}
                    className="min-h-11 w-full rounded-xl border border-emerald-300 bg-white text-sm font-semibold text-emerald-700 disabled:opacity-40"
                  >
                    Tandai semua OK
                  </button>
                  {g.items.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      highlight={showProblems && isProblem(item)}
                      onStatus={onStatus}
                      onDescription={onDescription}
                      onPhotoAdded={onPhotoAdded}
                      onPhotoRemove={onPhotoRemove}
                      onUploading={onUploading}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}

        <label className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="mb-1 block font-bold">Catatan umum</span>
          <textarea
            value={notes}
            onChange={(e) => onNotes(e.target.value)}
            rows={3}
            maxLength={4000}
            placeholder="Opsional"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-base outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          />
        </label>
      </main>

      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 px-4 pb-4 pt-3 backdrop-blur">
        <div className="mx-auto max-w-md space-y-2">
          {message && (
            <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {message}
            </p>
          )}
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="h-14 w-full rounded-2xl bg-emerald-600 text-lg font-bold text-white shadow active:scale-[0.98] disabled:opacity-60"
          >
            {submitting ? "Memproses…" : "Selesai & Buat Laporan"}
          </button>
        </div>
      </footer>
    </div>
  );
}
