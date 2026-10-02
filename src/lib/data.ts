import "server-only";
import { randomBytes } from "crypto";
import { getSupabase, must, PHOTO_BUCKET } from "./supabase";
import type { Area, Item, Report, ReportItem } from "./types";

const REPORT_ITEM_COLS =
  "id, report_id, item_id, area_name, area_note, area_sort, item_name, item_sort, status, description, photos";

export type AreaWithItems = Area & { items: Item[] };

export async function getChecklist(): Promise<AreaWithItems[]> {
  const db = getSupabase();
  const [areas, items] = await Promise.all([
    db.from("areas").select("*").order("sort_order").order("created_at"),
    db.from("items").select("*").order("sort_order").order("created_at"),
  ]);
  const areaRows = must(areas) as Area[];
  const itemRows = must(items) as Item[];
  return areaRows.map((a) => ({ ...a, items: itemRows.filter((i) => i.area_id === a.id) }));
}

export function newShareId(): string {
  return randomBytes(9).toString("base64url"); // 12 karakter url-safe
}

/** Buat laporan draft + snapshot seluruh area/item saat ini. */
export async function createReportWithSnapshot(
  inspectorName: string,
  guestArrivalAt: string | null,
): Promise<string> {
  const db = getSupabase();
  const checklist = await getChecklist();
  if (checklist.every((a) => a.items.length === 0)) {
    throw new Error("Checklist masih kosong. Tambahkan area dan item dulu.");
  }
  const report = must(
    await db
      .from("reports")
      .insert({
        share_id: newShareId(),
        inspector_name: inspectorName,
        guest_arrival_at: guestArrivalAt,
      })
      .select("id")
      .single(),
  ) as { id: string };

  const rows = checklist.flatMap((a) =>
    a.items.map((i) => ({
      report_id: report.id,
      item_id: i.id,
      area_name: a.name,
      area_note: a.note,
      area_sort: a.sort_order,
      item_name: i.name,
      item_sort: i.sort_order,
    })),
  );
  const { error } = await db.from("report_items").insert(rows);
  if (error) {
    await db.from("reports").delete().eq("id", report.id);
    throw new Error(error.message);
  }
  return report.id;
}

export async function getReport(id: string): Promise<Report | null> {
  const { data, error } = await getSupabase().from("reports").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Report | null) ?? null;
}

export async function getReportByShareId(shareId: string): Promise<Report | null> {
  const { data, error } = await getSupabase()
    .from("reports")
    .select("*")
    .eq("share_id", shareId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Report | null) ?? null;
}

export async function getReportItems(reportId: string): Promise<ReportItem[]> {
  const rows = must(
    await getSupabase()
      .from("report_items")
      .select(REPORT_ITEM_COLS)
      .eq("report_id", reportId)
      .order("area_sort")
      .order("item_sort"),
  ) as ReportItem[];
  return rows;
}

export interface DraftSummary extends Report {
  total: number;
  checked: number;
}

export async function listDrafts(): Promise<DraftSummary[]> {
  const db = getSupabase();
  const drafts = must(
    await db.from("reports").select("*").eq("status", "draft").order("created_at", { ascending: false }),
  ) as Report[];
  if (drafts.length === 0) return [];
  const rows = must(
    await db.from("report_items").select("report_id, status").in("report_id", drafts.map((d) => d.id)),
  ) as { report_id: string; status: string | null }[];
  return drafts.map((d) => {
    const mine = rows.filter((r) => r.report_id === d.id);
    return { ...d, total: mine.length, checked: mine.filter((r) => r.status).length };
  });
}

export interface HistorySummary extends Report {
  notOk: number;
}

export async function listHistory(limit = 30): Promise<HistorySummary[]> {
  const db = getSupabase();
  const reports = must(
    await db
      .from("reports")
      .select("*")
      .eq("status", "submitted")
      .order("submitted_at", { ascending: false })
      .limit(limit),
  ) as Report[];
  if (reports.length === 0) return [];
  const rows = must(
    await db
      .from("report_items")
      .select("report_id")
      .eq("status", "not_ok")
      .in("report_id", reports.map((r) => r.id)),
  ) as { report_id: string }[];
  return reports.map((r) => ({ ...r, notOk: rows.filter((x) => x.report_id === r.id).length }));
}

/** Path objek di bucket dari URL publik. */
export function photoPathFromUrl(url: string): string | null {
  const marker = `/${PHOTO_BUCKET}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length).split("?")[0]);
}

/** Hapus laporan beserta foto di storage (best effort). */
export async function deleteReportCascade(reportId: string): Promise<void> {
  const db = getSupabase();
  const rows = must(
    await db.from("report_items").select("photos").eq("report_id", reportId),
  ) as { photos: string[] }[];
  const paths = rows
    .flatMap((r) => r.photos)
    .map(photoPathFromUrl)
    .filter((p): p is string => !!p);
  if (paths.length > 0) await db.storage.from(PHOTO_BUCKET).remove(paths);
  const { error } = await db.from("reports").delete().eq("id", reportId);
  if (error) throw new Error(error.message);
}
