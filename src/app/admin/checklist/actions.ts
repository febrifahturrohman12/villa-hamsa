"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { getSupabase, must } from "@/lib/supabase";

const uuid = z.string().uuid();
const name = z.string().trim().min(1, "Nama wajib diisi").max(120);
const dir = z.enum(["up", "down"]);

type Table = "areas" | "items";

async function guard() {
  await requireSession();
}

function done() {
  revalidatePath("/admin/checklist");
}

async function nextOrder(table: Table, parent?: { col: string; id: string }): Promise<number> {
  let q = getSupabase().from(table).select("sort_order").order("sort_order", { ascending: false }).limit(1);
  if (parent) q = q.eq(parent.col, parent.id);
  const rows = must(await q) as { sort_order: number }[];
  return (rows[0]?.sort_order ?? 0) + 1;
}

/** Tukar posisi dengan tetangga lalu nomori ulang berurutan. */
async function move(table: Table, id: string, direction: "up" | "down", parent?: { col: string; id: string }) {
  const db = getSupabase();
  let q = db.from(table).select("id, sort_order").order("sort_order").order("created_at");
  if (parent) q = q.eq(parent.col, parent.id);
  const rows = must(await q) as { id: string; sort_order: number }[];
  const idx = rows.findIndex((r) => r.id === id);
  const target = direction === "up" ? idx - 1 : idx + 1;
  if (idx === -1 || target < 0 || target >= rows.length) return;
  [rows[idx], rows[target]] = [rows[target], rows[idx]];
  await Promise.all(
    rows.map((r, i) =>
      r.sort_order === i + 1
        ? Promise.resolve()
        : db
            .from(table)
            .update({ sort_order: i + 1 })
            .eq("id", r.id)
            .then(({ error }) => {
              if (error) throw new Error(error.message);
            }),
    ),
  );
}

export async function addArea(formData: FormData): Promise<void> {
  await guard();
  const n = name.parse(formData.get("name"));
  const order = await nextOrder("areas");
  const { error } = await getSupabase().from("areas").insert({ name: n, sort_order: order });
  if (error) throw new Error(error.message);
  done();
}

export async function updateArea(formData: FormData): Promise<void> {
  await guard();
  const id = uuid.parse(formData.get("id"));
  const n = name.parse(formData.get("name"));
  const note = z.string().trim().max(300).parse(formData.get("note") ?? "");
  const { error } = await getSupabase()
    .from("areas")
    .update({ name: n, note: note || null })
    .eq("id", id);
  if (error) throw new Error(error.message);
  done();
}

export async function moveArea(formData: FormData): Promise<void> {
  await guard();
  await move("areas", uuid.parse(formData.get("id")), dir.parse(formData.get("dir")));
  done();
}

export async function deleteArea(formData: FormData): Promise<void> {
  await guard();
  const { error } = await getSupabase().from("areas").delete().eq("id", uuid.parse(formData.get("id")));
  if (error) throw new Error(error.message);
  done();
}

export async function addItem(formData: FormData): Promise<void> {
  await guard();
  const areaId = uuid.parse(formData.get("areaId"));
  const n = name.parse(formData.get("name"));
  const order = await nextOrder("items", { col: "area_id", id: areaId });
  const { error } = await getSupabase().from("items").insert({ area_id: areaId, name: n, sort_order: order });
  if (error) throw new Error(error.message);
  done();
}

export async function renameItem(formData: FormData): Promise<void> {
  await guard();
  const id = uuid.parse(formData.get("id"));
  const n = name.parse(formData.get("name"));
  const { error } = await getSupabase().from("items").update({ name: n }).eq("id", id);
  if (error) throw new Error(error.message);
  done();
}

export async function moveItem(formData: FormData): Promise<void> {
  await guard();
  await move(
    "items",
    uuid.parse(formData.get("id")),
    dir.parse(formData.get("dir")),
    { col: "area_id", id: uuid.parse(formData.get("areaId")) },
  );
  done();
}

export async function deleteItem(formData: FormData): Promise<void> {
  await guard();
  const { error } = await getSupabase().from("items").delete().eq("id", uuid.parse(formData.get("id")));
  if (error) throw new Error(error.message);
  done();
}
