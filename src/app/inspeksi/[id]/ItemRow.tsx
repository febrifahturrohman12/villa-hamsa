"use client";

import { memo, useState } from "react";
import { prepareImage } from "@/lib/image";
import type { ItemStatus, ReportItem } from "@/lib/types";

interface Props {
  item: ReportItem;
  highlight: boolean;
  onStatus: (id: string, status: ItemStatus | null) => void;
  onDescription: (id: string, text: string) => void;
  onPhotoAdded: (id: string, url: string) => void;
  onPhotoRemove: (id: string, url: string) => void;
  onUploading: (delta: number) => void;
}

interface Upload {
  key: string;
  file: File;
  error?: string;
}

async function uploadPhoto(reportItemId: string, file: File): Promise<string> {
  const prepared = await prepareImage(file);
  const fd = new FormData();
  fd.append("reportItemId", reportItemId);
  fd.append("file", prepared);
  const res = await fetch("/api/photos", { method: "POST", body: fd });
  const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !json.url) throw new Error(json.error ?? "Gagal upload foto.");
  return json.url;
}

function ItemRowImpl({ item, highlight, onStatus, onDescription, onPhotoAdded, onPhotoRemove, onUploading }: Props) {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const isOk = item.status === "ok";
  const isNotOk = item.status === "not_ok";
  const descMissing = isNotOk && !item.description?.trim();

  async function runUpload(up: Upload) {
    setUploads((u) => u.map((x) => (x.key === up.key ? { ...x, error: undefined } : x)));
    onUploading(1);
    try {
      const url = await uploadPhoto(item.id, up.file);
      onPhotoAdded(item.id, url);
      setUploads((u) => u.filter((x) => x.key !== up.key));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Gagal upload foto.";
      setUploads((u) => u.map((x) => (x.key === up.key ? { ...x, error: msg } : x)));
    } finally {
      onUploading(-1);
    }
  }

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const list = Array.from(files).map((file) => ({ key: crypto.randomUUID(), file }));
    setUploads((u) => [...u, ...list]);
    for (const up of list) await runUpload(up);
  }

  return (
    <div
      id={`item-${item.id}`}
      className={`rounded-xl border p-3 ${
        highlight ? "border-rose-400 bg-rose-50 ring-2 ring-rose-200" : "border-slate-200 bg-white"
      }`}
    >
      <p className="mb-2 font-medium">{item.item_name}</p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          aria-pressed={isOk}
          onClick={() => onStatus(item.id, isOk ? null : "ok")}
          className={`min-h-12 rounded-xl border-2 font-semibold active:scale-[0.97] ${
            isOk
              ? "border-emerald-600 bg-emerald-600 text-white"
              : "border-emerald-200 bg-white text-emerald-700"
          }`}
        >
          OK
        </button>
        <button
          type="button"
          aria-pressed={isNotOk}
          onClick={() => onStatus(item.id, isNotOk ? null : "not_ok")}
          className={`min-h-12 rounded-xl border-2 font-semibold active:scale-[0.97] ${
            isNotOk
              ? "border-rose-600 bg-rose-600 text-white"
              : "border-rose-200 bg-white text-rose-700"
          }`}
        >
          Tidak Sesuai
        </button>
      </div>

      {isNotOk && (
        <div className="mt-3 space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Deskripsi masalah <span className="text-rose-600">*</span>
            </span>
            <textarea
              value={item.description ?? ""}
              onChange={(e) => onDescription(item.id, e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Jelaskan apa yang tidak sesuai…"
              className={`w-full rounded-xl border px-3 py-2 text-base outline-none focus:ring-4 ${
                descMissing && highlight
                  ? "border-rose-400 focus:ring-rose-100"
                  : "border-slate-300 focus:border-rose-400 focus:ring-rose-100"
              }`}
            />
          </label>

          <div className="flex flex-wrap gap-2">
            {item.photos.map((url) => (
              <div key={url} className="relative h-20 w-20 overflow-hidden rounded-lg bg-slate-100">
                <img src={url} alt="Foto bukti" className="h-full w-full object-cover" loading="lazy" />
                <button
                  type="button"
                  aria-label="Hapus foto"
                  onClick={() => onPhotoRemove(item.id, url)}
                  className="absolute right-0 top-0 flex h-9 w-9 items-center justify-center rounded-bl-lg bg-black/60 text-lg text-white"
                >
                  ×
                </button>
              </div>
            ))}
            {uploads.map((up) => (
              <div
                key={up.key}
                className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-1 text-center"
              >
                {up.error ? (
                  <>
                    <span className="line-clamp-2 text-[10px] leading-tight text-rose-600">{up.error}</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => void runUpload(up)}
                        className="rounded bg-slate-200 px-1.5 py-1 text-[10px] font-semibold"
                      >
                        Ulangi
                      </button>
                      <button
                        type="button"
                        aria-label="Buang"
                        onClick={() => setUploads((u) => u.filter((x) => x.key !== up.key))}
                        className="rounded bg-slate-200 px-1.5 py-1 text-[10px] font-semibold"
                      >
                        ×
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-600" />
                    <span className="text-[10px] text-slate-500">Mengunggah…</span>
                  </>
                )}
              </div>
            ))}
          </div>

          <label className="flex min-h-12 cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-slate-50 font-semibold text-slate-700 active:scale-[0.98]">
            📷 Tambah Foto
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = e.target.files;
                void onFiles(files);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      )}
    </div>
  );
}

const ItemRow = memo(ItemRowImpl);
export default ItemRow;
