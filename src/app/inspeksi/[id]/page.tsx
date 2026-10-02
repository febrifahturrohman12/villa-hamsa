import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { getReport, getReportItems } from "@/lib/data";
import Inspection from "./Inspection";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pengecekan – Villa Hamsa", robots: { index: false } };

export default async function InspectionPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const report = await getReport(id);
  if (!report) notFound();
  if (report.status === "submitted") redirect(`/inspeksi/${id}/selesai`);
  const items = await getReportItems(id);

  return (
    <Inspection
      reportId={id}
      inspectorName={report.inspector_name}
      initialItems={items}
      initialNotes={report.notes ?? ""}
    />
  );
}
