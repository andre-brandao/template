/** A stored value and when it lapses, in epoch ms, or null for never. Memory and file rows. */
export type Row = { value: string; expires: number | null };

/** The driver contract. The JSON and cache helpers are derived from these in `Kv`. */
export interface Store {
  get(key: string): Promise<string | null>;
  /** `ttl` in seconds; omitted = no expiry. */
  set(key: string, value: string, opts?: { ttl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
  /** Atomic counter (rate limits, attempts); a missing key starts at 0. */
  incr(key: string, by?: number, opts?: { ttl?: number }): Promise<number>;
  /** Keys under `prefix`, expired ones excluded. */
  keys(prefix: string): Promise<string[]>;
}
