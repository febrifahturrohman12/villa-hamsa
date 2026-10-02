// Token sesi bertanda tangan HMAC-SHA256 (Web Crypto: jalan di proxy & server).
export const SESSION_COOKIE = "vh_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 hari (detik)

const enc = new TextEncoder();

function toBase64Url(buf: ArrayBuffer): string {
  let s = "";
  for (const b of new Uint8Array(buf)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(data: string): Promise<ArrayBuffer> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET belum diset");
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return crypto.subtle.sign("HMAC", key, enc.encode(data));
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/** Bandingkan dua string tanpa membocorkan panjang/isi lewat timing. */
export async function safeEqual(a: string, b: string): Promise<boolean> {
  const [ha, hb] = await Promise.all([hmac("cmp:" + a), hmac("cmp:" + b)]);
  return bytesEqual(new Uint8Array(ha), new Uint8Array(hb));
}

export async function createSessionToken(): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  const payload = `v1.${exp}`;
  return `${payload}.${toBase64Url(await hmac(payload))}`;
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token || !process.env.SESSION_SECRET) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [v, expStr, sig] = parts;
  const exp = Number(expStr);
  if (v !== "v1" || !Number.isFinite(exp) || exp < Date.now() / 1000) return false;
  const expected = toBase64Url(await hmac(`${v}.${expStr}`));
  return safeEqual(sig, expected);
}
