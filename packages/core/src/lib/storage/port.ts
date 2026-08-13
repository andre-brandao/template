export type Object = { bytes: Uint8Array; contentType: string };

/** One listed object. `list` can't report content type — S3 and R2 don't return it. */
export type Entry = { key: string; size: number; lastModified: Date | null };

export type Meta = Entry & { contentType: string };

/**
 * The driver contract. The friendlier API (`exists`, `move`, `temporaryUrl`, ...) is
 * derived from these in `Storage`.
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
   * Optional time-limited URL for direct client access. Omitted when the backend can't
   * sign (fs, native R2) — `temporaryUrl` returns null and callers proxy the bytes.
   */
  presign?(opts: { key: string; method: "get" | "put"; expires?: number }): Promise<string>;
}
