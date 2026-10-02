-- Villa Hamsa - skema database. Jalankan di Supabase SQL Editor (aman dijalankan ulang).

create extension if not exists pgcrypto;

create table if not exists areas (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  note text null,
  sort_order int not null default 0,
  created_at timestamptz default now()
);

create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  area_id uuid not null references areas(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz default now()
);
create index if not exists items_area_id_idx on items(area_id);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  share_id text unique not null,
  inspector_name text not null,
  guest_arrival_at timestamptz null,
  notes text null,
  status text not null default 'draft' check (status in ('draft','submitted')),
  created_at timestamptz default now(),
  submitted_at timestamptz null
);

-- Snapshot checklist per laporan: perubahan checklist tidak mengubah laporan lama.
create table if not exists report_items (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(id) on delete cascade,
  item_id uuid null references items(id) on delete set null,
  area_name text not null,
  area_note text null,
  area_sort int not null default 0,
  item_name text not null,
  item_sort int not null default 0,
  status text null check (status in ('ok','not_ok')),
  description text null,
  photos text[] not null default '{}',
  updated_at timestamptz default now()
);
create index if not exists report_items_report_id_idx on report_items(report_id);

-- RLS aktif tanpa policy: hanya service role (server) yang bisa akses.
alter table areas enable row level security;
alter table items enable row level security;
alter table reports enable row level security;
alter table report_items enable row level security;

-- Operasi atomik untuk array foto (menghindari race saat upload paralel).
create or replace function append_photo(p_id uuid, p_url text)
returns void language sql as $$
  update report_items
     set photos = array_append(photos, p_url), updated_at = now()
   where id = p_id;
$$;

create or replace function remove_photo(p_id uuid, p_url text)
returns void language sql as $$
  update report_items
     set photos = array_remove(photos, p_url), updated_at = now()
   where id = p_id;
$$;

revoke execute on function append_photo(uuid, text) from public, anon, authenticated;
revoke execute on function remove_photo(uuid, text) from public, anon, authenticated;

-- Bucket foto (publik agar laporan bisa dibuka lewat link).
insert into storage.buckets (id, name, public)
values ('inspection-photos', 'inspection-photos', true)
on conflict do nothing;
