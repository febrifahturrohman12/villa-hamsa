import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getReport } from "@/lib/data";
import { getSupabase, PHOTO_BUCKET } from "@/lib/supabase";

export const runtime = "nodejs";

const MAX_BYTES = 4 * 1024 * 1024;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) return fail("Belum login", 401);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("Data tidak valid", 400);
  }
  const reportItemId = form.get("reportItemId");
  const file = form.get("file");
  if (typeof reportItemId !== "string" || !UUID_RE.test(reportItemId)) {
    return fail("reportItemId tidak valid", 400);
  }
  if (!(file instanceof File)) return fail("File tidak ada", 400);
  if (!file.type.startsWith("image/") || !EXT[file.type]) {
    return fail("File harus berupa gambar (JPEG/PNG/WebP/HEIC)", 415);
  }
  if (file.size > MAX_BYTES) return fail("Ukuran foto maksimal 4 MB", 413);
  if (file.size === 0) return fail("File kosong", 400);

  const db = getSupabase();
  const { data: row, error: rowErr } = await db
    .from("report_items")
    .select("id, report_id")
    .eq("id", reportItemId)
    .maybeSingle();
  if (rowErr) return fail(rowErr.message, 500);
  if (!row) return fail("Item tidak ditemukan", 404);
  const report = await getReport(row.report_id);
  if (!report || report.status !== "draft") return fail("Laporan sudah diselesaikan", 409);

  const path = `${row.report_id}/${reportItemId}/${randomBytes(8).toString("hex")}.${EXT[file.type]}`;
  const { error: upErr } = await db.storage
    .from(PHOTO_BUCKET)
    .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false });
  if (upErr) return fail(`Gagal upload: ${upErr.message}`, 500);

  const url = db.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
  const { error: rpcErr } = await db.rpc("append_photo", { p_id: reportItemId, p_url: url });
  if (rpcErr) {
    await db.storage.from(PHOTO_BUCKET).remove([path]);
    return fail(rpcErr.message, 500);
  }
  return NextResponse.json({ url });
}
