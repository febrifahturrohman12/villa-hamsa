// Util sisi klien: kompres foto sebelum upload.
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const MAX_SIDE = 1600;

export async function prepareImage(file: File): Promise<File> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    // Browser tidak bisa decode (mis. HEIC): kirim apa adanya jika cukup kecil.
    if (file.size <= MAX_UPLOAD_BYTES) return file;
    throw new Error("Format foto tidak didukung dan ukurannya terlalu besar (maks 4 MB).");
  }
  try {
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas tidak tersedia");
    ctx.drawImage(bitmap, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.75));
    if (!blob) throw new Error("Gagal memproses foto.");
    if (blob.size > MAX_UPLOAD_BYTES) throw new Error("Foto terlalu besar (maks 4 MB).");
    return new File([blob], "foto.jpg", { type: "image/jpeg" });
  } finally {
    bitmap.close();
  }
}
