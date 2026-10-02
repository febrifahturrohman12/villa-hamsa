import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { getReport } from "@/lib/data";
import { getBaseUrl } from "@/lib/base-url";
import ShareButtons from "@/components/ShareButtons";

export const dynamic = "force-dynamic";
export const metadata = { title: "Laporan Selesai – Villa Hamsa", robots: { index: false } };

export default async function DonePage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const report = await getReport(id);
  if (!report) notFound();
  if (report.status !== "submitted") redirect(`/inspeksi/${id}`);
  const url = `${await getBaseUrl()}/r/${report.share_id}`;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6 py-10">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-4xl text-emerald-600">
          ✓
        </div>
        <h1 className="text-2xl font-bold">Laporan selesai dibuat</h1>
        <p className="mt-1 text-slate-600">Bagikan link berikut ke atasan Anda.</p>
      </div>

      <div className="break-all rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
        {url}
      </div>

      <ShareButtons url={url} />

      <div className="space-y-2">
        <Link
          href={`/r/${report.share_id}`}
          className="flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white font-semibold"
        >
          Lihat Laporan
        </Link>
        <Link href="/" className="flex min-h-12 items-center justify-center text-sm font-medium text-slate-600 underline">
          Kembali ke Beranda
        </Link>
      </div>
    </main>
  );
}
