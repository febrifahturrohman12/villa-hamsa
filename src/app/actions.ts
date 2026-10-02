"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createReportWithSnapshot, deleteReportCascade } from "@/lib/data";
import { localInputToIso } from "@/lib/format";

const createSchema = z.object({
  inspectorName: z.string().trim().min(1, "Nama inspektor wajib diisi").max(80),
  guestArrival: z.string().optional(),
});

export interface CreateReportState {
  error?: string;
}

export async function createReport(
  _prev: CreateReportState,
  formData: FormData,
): Promise<CreateReportState> {
  await requireSession();
  const parsed = createSchema.safeParse({
    inspectorName: formData.get("inspectorName"),
    guestArrival: formData.get("guestArrival") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const guestIso = parsed.data.guestArrival ? localInputToIso(parsed.data.guestArrival) : null;
  let id: string;
  try {
    id = await createReportWithSnapshot(parsed.data.inspectorName, guestIso);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Gagal membuat laporan." };
  }
  redirect(`/inspeksi/${id}`);
}

export async function deleteReport(formData: FormData): Promise<void> {
  await requireSession();
  const id = z.string().uuid().parse(formData.get("id"));
  await deleteReportCascade(id);
  revalidatePath("/");
}
