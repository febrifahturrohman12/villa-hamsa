"use server";

import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { getReport, photoPathFromUrl } from "@/lib/data";
import { getSupabase, must, PHOTO_BUCKET } from "@/lib/supabase";

const uuid = z.string().uuid();

async function assertDraft(reportId: string) {
  const report = await getReport(reportId);
  if (!report) throw new Error("Laporan tidak ditemukan");
  if (report.status !== "draft") throw new Error("Laporan sudah diselesaikan");
  return report;
}

const patchSchema = z.object({
  status: z.enum(["ok", "not_ok"]).nullable().optional(),
  description: z.string().max(2000).optional(),
});

export async function saveItem(
  reportId: string,
  itemId: string,
  patch: { status?: "ok" | "not_ok" | null; description?: string },
): Promise<void> {
  await requireSession();
  uuid.parse(reportId);
  uuid.parse(itemId);
  const data = patchSchema.parse(patch);
  await assertDraft(reportId);
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (data.status !== undefined) update.status = data.status;
  if (data.description !== undefined) update.description = data.description;
  const { error } = await getSupabase()
    .from("report_items")
    .update(update)
    .eq("id", itemId)
    .eq("report_id", reportId);
  if (error) throw new Error(error.message);
}

export async function saveNotes(reportId: string, notes: string): Promise<void> {
  await requireSession();
  uuid.parse(reportId);
  const text = z.string().max(4000).parse(notes);
  await assertDraft(reportId);
  const { error } = await getSupabase()
    .from("reports")
    .update({ notes: text.trim() ? text : null })
    .eq("id", reportId);
  if (error) throw new Error(error.message);
}

export type SubmitResult = { ok: true } | { ok: false; message: string };

export async function submitReport(reportId: string): Promise<SubmitResult> {
  await requireSession();
  uuid.parse(reportId);
  await assertDraft(reportId);
  const db = getSupabase();
  const rows = must(
    await db.from("report_items").select("status, description").eq("report_id", reportId),
  ) as { status: string | null; description: string | null }[];
  const missing = rows.filter((r) => !r.status).length;
  const noDesc = rows.filter((r) => r.status === "not_ok" && !r.description?.trim()).length;
  if (missing > 0 || noDesc > 0) {
    return {
      ok: false,
      message: `Masih ada ${missing} item belum dicek dan ${noDesc} item tanpa deskripsi.`,
    };
  }
  const { error } = await db
    .from("reports")
    .update({ status: "submitted", submitted_at: new Date().toISOString() })
    .eq("id", reportId)
    .eq("status", "draft");
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

export async function removePhoto(reportItemId: string, url: string): Promise<void> {
  await requireSession();
  uuid.parse(reportItemId);
  const db = getSupabase();
  const row = must(
    await db.from("report_items").select("report_id, photos").eq("id", reportItemId).single(),
  ) as { report_id: string; photos: string[] };
  await assertDraft(row.report_id);
  if (!row.photos.includes(url)) return; // sudah terhapus
  const { error } = await db.rpc("remove_photo", { p_id: reportItemId, p_url: url });
  if (error) throw new Error(error.message);
  const path = photoPathFromUrl(url);
  if (path) await db.storage.from(PHOTO_BUCKET).remove([path]);
}
