import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { getChecklist } from "@/lib/data";
import SubmitButton from "@/components/SubmitButton";
import {
  addArea,
  addItem,
  deleteArea,
  deleteItem,
  moveArea,
  moveItem,
  renameItem,
  updateArea,
} from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kelola Checklist – Villa Hamsa", robots: { index: false } };

const inputCls =
  "h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 text-base outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";
const iconBtn = "h-11 w-11 rounded-xl border border-slate-300 bg-white text-lg disabled:opacity-30";

function MoveButtons({
  action,
  id,
  areaId,
  first,
  last,
}: {
  action: (fd: FormData) => Promise<void>;
  id: string;
  areaId?: string;
  first: boolean;
  last: boolean;
}) {
  return (
    <>
      {(["up", "down"] as const).map((d) => (
        <form key={d} action={action}>
          <input type="hidden" name="id" value={id} />
          {areaId && <input type="hidden" name="areaId" value={areaId} />}
          <input type="hidden" name="dir" value={d} />
          <button
            type="submit"
            disabled={d === "up" ? first : last}
            aria-label={d === "up" ? "Naikkan" : "Turunkan"}
            className={iconBtn}
          >
            {d === "up" ? "↑" : "↓"}
          </button>
        </form>
      ))}
    </>
  );
}

export default async function ChecklistAdminPage() {
  await requireSession();
  const areas = await getChecklist();

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 pb-12 pt-4">
      <header className="flex items-center gap-3">
        <Link href="/" className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 bg-white">
          ←
        </Link>
        <div>
          <h1 className="text-xl font-bold">Kelola Checklist</h1>
          <p className="text-xs text-slate-500">Perubahan hanya berlaku untuk pengecekan baru.</p>
        </div>
      </header>

      <form action={addArea} className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-3">
        <input name="name" required maxLength={120} placeholder="Nama area baru" className={inputCls} />
        <SubmitButton pendingText="…" className="bg-emerald-600 text-white">
          Tambah
        </SubmitButton>
      </form>

      {areas.length === 0 && <p className="text-sm text-slate-500">Belum ada area.</p>}

      {areas.map((a, ai) => (
        <details key={a.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <summary className="flex min-h-14 cursor-pointer items-center justify-between px-4 py-3">
            <span className="font-bold">{a.name}</span>
            <span className="text-sm text-slate-500">{a.items.length} item</span>
          </summary>

          <div className="space-y-4 border-t border-slate-100 p-3">
            <form action={updateArea} className="space-y-2">
              <input type="hidden" name="id" value={a.id} />
              <input name="name" defaultValue={a.name} required maxLength={120} aria-label="Nama area" className={inputCls} />
              <input
                name="note"
                defaultValue={a.note ?? ""}
                maxLength={300}
                placeholder="Catatan area (opsional)"
                aria-label="Catatan area"
                className={inputCls}
              />
              <SubmitButton pendingText="Menyimpan…" className="w-full border border-slate-300 bg-white">
                Simpan Area
              </SubmitButton>
            </form>

            <div className="flex gap-2">
              <MoveButtons action={moveArea} id={a.id} first={ai === 0} last={ai === areas.length - 1} />
              <form action={deleteArea} className="ml-auto">
                <input type="hidden" name="id" value={a.id} />
                <SubmitButton
                  pendingText="Menghapus…"
                  confirmMessage={`Hapus area "${a.name}" beserta ${a.items.length} item di dalamnya? Laporan lama tidak terpengaruh.`}
                  className="border border-rose-300 bg-white text-rose-700"
                >
                  Hapus Area
                </SubmitButton>
              </form>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-600">Item</h3>
              {a.items.map((it, ii) => (
                <div key={it.id} className="space-y-2 rounded-xl bg-slate-50 p-2">
                  <form action={renameItem} className="flex gap-2">
                    <input type="hidden" name="id" value={it.id} />
                    <input name="name" defaultValue={it.name} required maxLength={120} aria-label="Nama item" className={inputCls} />
                    <button type="submit" className="min-h-11 shrink-0 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold">
                      Simpan
                    </button>
                  </form>
                  <div className="flex gap-2">
                    <MoveButtons
                      action={moveItem}
                      id={it.id}
                      areaId={a.id}
                      first={ii === 0}
                      last={ii === a.items.length - 1}
                    />
                    <form action={deleteItem} className="ml-auto">
                      <input type="hidden" name="id" value={it.id} />
                      <SubmitButton
                        pendingText="…"
                        confirmMessage={`Hapus item "${it.name}"?`}
                        className="border border-rose-300 bg-white text-sm text-rose-700"
                      >
                        Hapus
                      </SubmitButton>
                    </form>
                  </div>
                </div>
              ))}
              <form action={addItem} className="flex gap-2 pt-1">
                <input type="hidden" name="areaId" value={a.id} />
                <input name="name" required maxLength={120} placeholder="Item baru" aria-label="Item baru" className={inputCls} />
                <SubmitButton pendingText="…" className="shrink-0 bg-emerald-600 text-white">
                  Tambah
                </SubmitButton>
              </form>
            </div>
          </div>
        </details>
      ))}
    </main>
  );
}
