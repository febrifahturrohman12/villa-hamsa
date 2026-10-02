import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getReportByShareId, getReportItems } from "@/lib/data";
import { getBaseUrl } from "@/lib/base-url";
import { formatDateShort, formatDateTime } from "@/lib/format";
import { groupByArea } from "@/lib/types";
import PhotoGrid from "@/components/PhotoGrid";

export const dynamic = "force-dynamic";

const SHARE_ID_RE = /^[A-Za-z0-9_-]{6,32}$/;

const load = cache(async (shareId: string) => {
  if (!SHARE_ID_RE.test(shareId)) return null;
  const report = await getReportByShareId(shareId);
  if (!report) return null;
  const items = report.status === "submitted" ? await getReportItems(report.id) : [];
  return { report, items };
});

export async function generateMetadata({ params }: { params: Promise<{ shareId: string }> }): Promise<Metadata> {
  const { shareId } = await params;
  const data = await load(shareId);
  const base: Metadata = { robots: { index: false, follow: false } };
  if (!data || data.report.status !== "submitted") {
    return { ...base, title: "Laporan Pengecekan Kebersihan – Villa Hamsa" };
  }
  const notOk = data.items.filter((i) => i.status === "not_ok").length;
  const title = `Laporan Kebersihan Villa Hamsa – ${formatDateShort(data.report.submitted_at)} · ${
    notOk > 0 ? `${notOk} tidak sesuai` : "semua sesuai"
  }`;
  const description = `Diperiksa oleh ${data.report.inspector_name}. ${data.items.length} item dicek.`;
  return {
    ...base,
    metadataBase: new URL(await getBaseUrl()),
    title,
    description,
    openGraph: { title, description, type: "article", locale: "id_ID", siteName: "Villa Hamsa" },
    twitter: { card: "summary", title, description },
  };
}

export default async function PublicReportPage({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;
  const data = await load(shareId);
  if (!data) notFound();
  const { report, items } = data;

  if (report.status !== "submitted") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 text-5xl">⏳</div>
        <h1 className="text-xl font-bold">Laporan belum diselesaikan</h1>
        <p className="mt-2 text-slate-600">Pengecekan ini masih berlangsung. Coba buka lagi nanti.</p>
      </main>
    );
  }

  const groups = groupByArea(items);
  const notOkItems = items.filter((i) => i.status === "not_ok");
  const okCount = items.filter((i) => i.status === "ok").length;

  return (
    <main className="mx-auto max-w-md space-y-5 px-4 pb-12 pt-6">
      <header>
        <h1 className="text-xl font-bold leading-snug">Laporan Pengecekan Kebersihan – Villa Hamsa</h1>
        <dl className="mt-3 space-y-1 text-sm text-slate-600">
          <div className="flex gap-2">
            <dt className="w-28 shrink-0 text-slate-500">Diselesaikan</dt>
            <dd>{formatDateTime(report.submitted_at)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-28 shrink-0 text-slate-500">Inspektor</dt>
            <dd>{report.inspector_name}</dd>
          </div>
          {report.guest_arrival_at && (
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-slate-500">Tamu tiba</dt>
              <dd>{formatDateTime(report.guest_arrival_at)}</dd>
            </div>
          )}
        </dl>
        {report.notes && (
          <div className="mt-3 rounded-xl bg-white p-3 text-sm shadow-sm">
            <p className="mb-1 font-semibold">Catatan umum</p>
            <p className="whitespace-pre-wrap text-slate-700">{report.notes}</p>
          </div>
        )}
      </header>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-white p-3 shadow-sm">
          <p className="text-2xl font-bold">{items.length}</p>
          <p className="text-xs text-slate-500">Total item</p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-3 shadow-sm">
          <p className="text-2xl font-bold text-emerald-700">{okCount}</p>
          <p className="text-xs text-emerald-700">OK</p>
        </div>
        <div className="rounded-xl bg-rose-50 p-3 shadow-sm">
          <p className="text-2xl font-bold text-rose-700">{notOkItems.length}</p>
          <p className="text-xs text-rose-700">Tidak Sesuai</p>
        </div>
      </div>

      {notOkItems.length === 0 ? (
        <div className="rounded-2xl bg-emerald-600 px-4 py-4 text-center text-lg font-bold text-white">
          Semua sesuai ✓
        </div>
      ) : (
        <div className="rounded-2xl bg-rose-600 px-4 py-4 text-center text-lg font-bold text-white">
          {notOkItems.length} item perlu tindakan
        </div>
      )}

      {notOkItems.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold">Perlu Tindakan</h2>
          {notOkItems.map((i) => (
            <article key={i.id} className="rounded-2xl border border-rose-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">{i.area_name}</p>
              <h3 className="font-bold">{i.item_name}</h3>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{i.description}</p>
              <PhotoGrid photos={i.photos} />
            </article>
          ))}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Detail per Area</h2>
        {groups.map((g) => {
          const bad = g.items.filter((i) => i.status === "not_ok").length;
          return (
            <details
              key={g.key}
              open={bad > 0}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-2 px-4 py-3">
                <span className="font-semibold">{g.name}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    bad > 0 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {bad > 0 ? `${bad} tidak sesuai` : "Sesuai"}
                </span>
              </summary>
              <ul className="divide-y divide-slate-100 border-t border-slate-100">
                {g.items.map((i) => (
                  <li key={i.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                        i.status === "ok" ? "bg-emerald-500" : i.status === "not_ok" ? "bg-rose-500" : "bg-slate-300"
                      }`}
                    >
                      {i.status === "ok" ? "✓" : i.status === "not_ok" ? "✗" : "–"}
                    </span>
                    <span className={i.status === "not_ok" ? "font-semibold text-rose-700" : ""}>{i.item_name}</span>
                  </li>
                ))}
              </ul>
            </details>
          );
        })}
      </section>
    </main>
  );
}
