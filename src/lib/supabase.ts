import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const PHOTO_BUCKET = "inspection-photos";

let client: SupabaseClient | null = null;

/** Client service-role, dibuat lazy agar `next build` jalan tanpa env. */
export function getSupabase(): SupabaseClient {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error("SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY belum diset");
    }
    client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

/** Lempar error jika query Supabase gagal. */
export function must<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}
