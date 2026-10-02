export type SaveState = "saved" | "saving" | "error";

interface Entry {
  v: number;
  payload: Record<string, unknown>;
}

/**
 * Antrian autosave: menyimpan perubahan terakhir per key, mengirim berurutan,
 * dan mengulang otomatis jika gagal (perubahan tetap di memori sampai berhasil).
 */
export class SaveQueue {
  private dirty = new Map<string, Entry>();
  private chain: Promise<boolean> = Promise.resolve(true);
  private timer: ReturnType<typeof setTimeout> | undefined;
  private retryTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private send: (key: string, payload: Record<string, unknown>) => Promise<void>,
    private onState: (s: SaveState) => void,
  ) {}

  get pending(): boolean {
    return this.dirty.size > 0;
  }

  enqueue(key: string, payload: Record<string, unknown>, delay = 0) {
    const cur = this.dirty.get(key);
    this.dirty.set(key, { v: (cur?.v ?? 0) + 1, payload: { ...cur?.payload, ...payload } });
    this.onState("saving");
    clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.flush(), delay);
  }

  /** Kirim semua perubahan tertunda. Resolve true jika semua tersimpan. */
  flush(): Promise<boolean> {
    clearTimeout(this.timer);
    clearTimeout(this.retryTimer);
    this.chain = this.chain.then(() => this.run());
    return this.chain;
  }

  dispose() {
    clearTimeout(this.timer);
    clearTimeout(this.retryTimer);
  }

  private async run(): Promise<boolean> {
    if (this.dirty.size === 0) {
      this.onState("saved");
      return true;
    }
    this.onState("saving");
    while (this.dirty.size > 0) {
      for (const [key, entry] of Array.from(this.dirty)) {
        try {
          await this.send(key, entry.payload);
        } catch {
          this.onState("error");
          this.retryTimer = setTimeout(() => void this.flush(), 4000);
          return false;
        }
        // hanya hapus jika tidak ada perubahan baru selama pengiriman
        if (this.dirty.get(key)?.v === entry.v) this.dirty.delete(key);
      }
    }
    this.onState("saved");
    return true;
  }
}
