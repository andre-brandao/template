import type { Disk, Entry } from "../port";

type R2Object = {
  key: string;
  size: number;
  uploaded: Date;
  httpMetadata?: { contentType?: string };
};

/**
 * Structural subset of `R2Bucket` — importing `@cloudflare/workers-types` would
 * redeclare ambient globals for the whole program. The real binding satisfies this.
 */
export interface Bucket {
  put(
    key: string,
    value: Uint8Array,
    options?: { httpMetadata?: { contentType?: string } },
  ): Promise<unknown>;
  get(key: string): Promise<
    | (R2Object & {
        arrayBuffer(): Promise<ArrayBuffer>;
      })
    | null
  >;
  head(key: string): Promise<R2Object | null>;
  list(options?: {
    prefix?: string;
    cursor?: string;
  }): Promise<{ objects: R2Object[]; truncated: boolean; cursor?: string }>;
  delete(key: string): Promise<void>;
}

/** Native Cloudflare R2 binding — no credentials, no network hop. Cloudflare Worker deploy only. */
export function r2(bucket: Bucket): Disk {
  return {
    async put(key, bytes, contentType) {
      await bucket.put(key, bytes, { httpMetadata: { contentType } });
    },
    async get(key) {
      const object = await bucket.get(key);
      if (!object) return null;
      return {
        bytes: new Uint8Array(await object.arrayBuffer()),
        contentType: object.httpMetadata?.contentType ?? "application/octet-stream",
      };
    },
    async delete(key) {
      await bucket.delete(key);
    },
    async head(key) {
      const object = await bucket.head(key);
      if (!object) return null;
      return {
        key,
        size: object.size,
        contentType: object.httpMetadata?.contentType ?? "application/octet-stream",
        lastModified: object.uploaded,
      };
    },
    async list(prefix) {
      const found: Entry[] = [];
      let cursor: string | undefined;

      do {
        const page = await bucket.list({ prefix, cursor });
        found.push(
          ...page.objects.map((object) => ({
            key: object.key,
            size: object.size,
            lastModified: object.uploaded,
          })),
        );
        cursor = page.truncated ? page.cursor : undefined;
      } while (cursor);

      return found;
    },
    /** The binding has no server-side copy, so this reads and rewrites the object. */
    async copy(from, to) {
      const object = await bucket.get(from);
      if (!object) throw new Error(`No such key: ${from}`);
      await bucket.put(to, new Uint8Array(await object.arrayBuffer()), {
        httpMetadata: { contentType: object.httpMetadata?.contentType ?? "" },
      });
    },
  };
}
