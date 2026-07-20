import type { Port } from "../port";

/**
 * Structural subset of Cloudflare's `R2Bucket` binding — deliberately not imported
 * from `@cloudflare/workers-types`, whose `.d.ts` has no imports/exports and so is
 * treated as a global script: importing anything from it redeclares ambient globals
 * (`File`, `Request`, ...) for the whole program. The real binding satisfies this.
 */
export interface R2BucketLike {
  put(
    key: string,
    value: Uint8Array,
    options?: { httpMetadata?: { contentType?: string } },
  ): Promise<unknown>;
  get(key: string): Promise<{
    arrayBuffer(): Promise<ArrayBuffer>;
    httpMetadata?: { contentType?: string };
  } | null>;
  delete(key: string): Promise<void>;
}

/** Native Cloudflare R2 binding — no credentials, no network hop. Cloudflare Worker deploy only. */
export function createR2Storage(bucket: R2BucketLike): Port {
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
    async del(key) {
      await bucket.delete(key);
    },
  };
}
