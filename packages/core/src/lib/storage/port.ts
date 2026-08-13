export type Object = { bytes: Uint8Array; contentType: string };

/** One listed object. `list` can't report content type — S3 and R2 don't return it. */
export type Entry = { key: string; size: number; lastModified: Date | null };

export type Meta = Entry & { contentType: string };

/**
 * The driver contract — what a backend must implement, Flysystem's half of Laravel's
 * split. The friendlier API (`exists`, `size`, `move`, `files`, `temporaryUrl`) is
 * derived from these in `Storage`, so adding a backend stays a ~50 line job.
 */
export interface Disk {
  put(key: string, bytes: Uint8Array, contentType: string): Promise<void>;
  get(key: string): Promise<Object | null>;
  delete(key: string): Promise<void>;
  /** Metadata without the bytes, or null when the key is absent. */
  head(key: string): Promise<Meta | null>;
  /** Every key under `prefix`. Flat — `/` carries no meaning to a disk. */
  list(prefix: string): Promise<Entry[]>;
  /** Server-side where the backend supports it, read-then-write where it doesn't. */
  copy(from: string, to: string): Promise<void>;
  /**
   * Optional: a time-limited URL for direct client access, bypassing the app.
   * Omitted when the backend can't sign (fs, native R2 binding) — `temporaryUrl`
   * then returns null and callers fall back to proxying bytes. `method: "put"`
   * reserves direct uploads.
   */
  presign?(opts: { key: string; method: "get" | "put"; expires?: number }): Promise<string>;
}
