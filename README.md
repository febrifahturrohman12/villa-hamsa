# Villa Hamsa – Checklist Kebersihan

Aplikasi mobile-first untuk pengecekan kebersihan villa. Inspektor berkeliling membawa HP, menandai tiap item
OK / Tidak Sesuai (deskripsi + foto), lalu membagikan link laporan publik (read-only) ke atasan.

Stack: Next.js (App Router) + Tailwind + Supabase (Postgres & Storage, hanya diakses dari server).

## Setup

1. Buat project di [Supabase](https://supabase.com).
2. Buka **SQL Editor**, jalankan berurutan:
   1. `supabase/schema.sql` (tabel, RLS, fungsi, bucket `inspection-photos`)
   2. `supabase/seed.sql` (isi checklist awal; dilewati jika tabel `areas` sudah berisi)
3. Salin **Project URL** dan **service_role key** (Project Settings → API).
4. Salin `.env.example` menjadi `.env.local`, lalu isi:
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
   - `INSPECTOR_PIN` – PIN login inspektor
   - `SESSION_SECRET` – string acak panjang (mis. `openssl rand -base64 32`)
   - `NEXT_PUBLIC_APP_TIMEZONE` – default `Asia/Jakarta`
5. Gunakan Node 24 (`.nvmrc`), lalu:

   ```bash
   npm install
   npm run dev
   ```

   Buka http://localhost:3000 dan masuk dengan PIN.

## Deploy ke Vercel

1. Import repo di Vercel.
2. Set environment variables yang sama dengan `.env.local`.
3. Pastikan Node.js version **24.x** (Project Settings → General).
4. Deploy.

## Catatan

- Service role key hanya dipakai di server; jangan pernah diberi prefix `NEXT_PUBLIC_`.
- Perubahan checklist hanya berlaku untuk pengecekan baru; laporan lama adalah snapshot.
- Link laporan `/r/<id>` bersifat publik (siapa pun yang punya link bisa membuka) dan tidak diindeks mesin pencari.
