export type ItemStatus = "ok" | "not_ok";
export type ReportStatus = "draft" | "submitted";

export interface Area {
  id: string;
  name: string;
  note: string | null;
  sort_order: number;
}

export interface Item {
  id: string;
  area_id: string;
  name: string;
  sort_order: number;
}

export interface Report {
  id: string;
  share_id: string;
  inspector_name: string;
  guest_arrival_at: string | null;
  notes: string | null;
  status: ReportStatus;
  created_at: string;
  submitted_at: string | null;
}

export interface ReportItem {
  id: string;
  report_id: string;
  item_id: string | null;
  area_name: string;
  area_note: string | null;
  area_sort: number;
  item_name: string;
  item_sort: number;
  status: ItemStatus | null;
  description: string | null;
  photos: string[];
}

export interface AreaGroup {
  key: string;
  name: string;
  note: string | null;
  items: ReportItem[];
}

/** Kelompokkan report_items per area (urut sesuai snapshot). */
export function groupByArea(items: ReportItem[]): AreaGroup[] {
  const sorted = [...items].sort(
    (a, b) =>
      a.area_sort - b.area_sort ||
      a.area_name.localeCompare(b.area_name) ||
      a.item_sort - b.item_sort,
  );
  const groups: AreaGroup[] = [];
  const index = new Map<string, AreaGroup>();
  for (const it of sorted) {
    const key = `${it.area_sort}::${it.area_name}`;
    let g = index.get(key);
    if (!g) {
      g = { key, name: it.area_name, note: it.area_note, items: [] };
      index.set(key, g);
      groups.push(g);
    }
    g.items.push(it);
  }
  return groups;
}
