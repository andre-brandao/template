import type { R2Bucket } from "@cloudflare/workers-types";
import type { Storage } from "../index";

/** Native Cloudflare R2 binding — no credentials, no network hop. Cloudflare Worker deploy only. */
export function createR2Storage(bucket: R2Bucket): Storage.Port {
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
