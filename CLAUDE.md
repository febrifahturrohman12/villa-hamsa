# VillaHamsa — Claude guide

> Ramping sengaja. Isi HANYA yang tidak bisa ditebak dari kode. Target < 100 baris.
> Jangan tulis struktur folder, penjelasan kode, atau sejarah git di sini.

## Stack
- Node 24.15.0 (`.nvmrc`), Next.js 16 (App Router), React 19, Tailwind 4, TypeScript
- Supabase (Postgres + Storage bucket `inspection-photos`), hanya diakses dari server via service role key
- Deploy: Vercel

## Perintah
- Install: `npm install`
- Run dev: `npm run dev`
- Test: (belum ada)
- Build: `npm run build`
- Lint: `npm run lint`

## Konvensi
- UI berbahasa Indonesia, mobile-first (max-w-md)
- Mutasi lewat server action / route handler yang SELALU cek sesi (`requireSession` / `isAuthenticated`), jangan hanya andalkan proxy

## Gotcha / jangan lakukan
- Node global di mesin ini v14: jalankan perintah dengan `export PATH="/f/WORKING/STACK/nvm/v24.15.0:$PATH"`, jangan `nvm use`
- Next 16: middleware = `src/proxy.ts` (fungsi `proxy`)
- `report_items` adalah snapshot nama area/item; edit checklist tidak boleh mengubah laporan lama
- Batas body Vercel 4,5 MB: upload foto dibatasi 4 MB, dikompres di klien

## Delegasi (default sesi ini)
- Leader menganalisis, merencanakan, memverifikasi — **tidak** menulis kode dalam jumlah banyak sendiri.
- Delegasikan penulisan/perubahan kode ke subagent `goblin`; pencarian read-only lintas file ke `gremlin`.
- Kerjakan sendiri hanya: edit satu-baris sepele, tweak config, membaca/mencari untuk paham, atau saat user memintanya langsung.

## File state (dikelola plugin vibe)
- `PROGRESS.md` — status pekerjaan (`/vibe:progress`)
- `HANDOFF.md` — ringkasan untuk lanjut sesi setelah `/clear` (`/vibe:handoff`)
- `DECISIONS.md` — keputusan arsitektur & alasannya
