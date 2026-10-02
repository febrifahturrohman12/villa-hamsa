import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { listDrafts, listHistory } from "@/lib/data";
import { formatDateShort, formatDateTime } from "@/lib/format";
import { getBaseUrl } from "@/lib/base-url";
import SubmitButton from "@/components/SubmitButton";
import ShareButtons from "@/components/ShareButtons";
import { logout } from "./login/actions";
import { deleteReport } from "./actions";
import NewReport from "./NewReport";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await requireSession();
  const [drafts, history, base] = await Promise.all([listDrafts(), listHistory(30), getBaseUrl()]);

  return (
    <main className="mx-auto max-w-md space-y-6 px-4 pb-12 pt-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Villa Hamsa</h1>
          <p className="text-sm text-slate-600">Pengecekan Kebersihan</p>
        </div>
        <form action={logout}>
          <button type="submit" className="min-h-11 rounded-xl px-3 text-sm font-medium text-slate-600 underline">
            Keluar
          </button>
        </form>
      </header>

      <NewReport />

      {drafts.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold">Belum selesai</h2>
          {drafts.map((d) => (
            <div key={d.id} className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="font-semibold">{d.inspector_name}</p>
              <p className="text-sm text-slate-600">
                Dimulai {formatDateTime(d.created_at)} · {d.checked}/{d.total} dicek
              </p>
              <div className="mt-3 flex gap-2">
                <Link
                  href={`/inspeksi/${d.id}`}
                  className="flex min-h-11 flex-1 items-center justify-center rounded-xl bg-emerald-600 font-semibold text-white"
                >
                  Lanjutkan
                </Link>
                <form action={deleteReport}>
                  <input type="hidden" name="id" value={d.id} />
                  <SubmitButton
                    pendingText="Menghapus…"
                    confirmMessage="Hapus pengecekan ini beserta semua fotonya? Tidak bisa dibatalkan."
                    className="border border-rose-300 bg-white text-rose-700"
                  >
                    Hapus
                  </SubmitButton>
                </form>
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Riwayat</h2>
        {history.length === 0 && <p className="text-sm text-slate-500">Belum ada laporan.</p>}
        {history.map((r) => (
          <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{formatDateShort(r.submitted_at)}</p>
                <p className="text-sm text-slate-600">{r.inspector_name}</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  r.notOk > 0 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {r.notOk > 0 ? `${r.notOk} tidak sesuai` : "Semua sesuai"}
              </span>
            </div>
            <div className="mt-3 space-y-2">
              <Link
                href={`/r/${r.share_id}`}
                className="flex min-h-11 items-center justify-center rounded-xl border border-slate-300 text-sm font-semibold"
              >
                Buka Laporan
              </Link>
              <ShareButtons url={`${base}/r/${r.share_id}`} size="sm" />
            </div>
          </div>
        ))}
      </section>

      <Link
        href="/admin/checklist"
        className="flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white font-semibold"
      >
        Kelola Checklist
      </Link>
    </main>
  );
}
