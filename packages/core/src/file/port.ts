export type Object = { bytes: Uint8Array; contentType: string };

/** Where bytes live. Swappable backend: fs (dev/self-host), s3 (AWS/R2 keys), r2 (Worker binding). */
export interface Port {
  put(key: string, bytes: Uint8Array, contentType: string): Promise<void>;
  get(key: string): Promise<Object | null>;
  del(key: string): Promise<void>;
  /**
   * Optional: a time-limited URL for direct client access, bypassing the app.
   * Omitted when the backend can't sign (fs, native R2 binding) — callers
   * fall back to proxying bytes. `method: "put"` reserves direct uploads.
   */
  presign?(opts: { key: string; method: "get" | "put"; expires?: number }): Promise<string>;
}
