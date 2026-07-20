import { AwsClient } from "aws4fetch";
import type { Port } from "../port";

export type S3Config = {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
};

/** S3-compatible backend (AWS S3 or R2 via access keys) via `aws4fetch`, path-style requests. */
export function createS3Storage(opts: S3Config): Port {
  const client = new AwsClient({
    accessKeyId: opts.accessKeyId,
    secretAccessKey: opts.secretAccessKey,
    region: opts.region,
    service: "s3",
  });

  const url = (key: string) =>
    `${opts.endpoint.replace(/\/$/, "")}/${opts.bucket}/${key
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`;

  return {
    async put(key, bytes, contentType) {
      const res = await client.fetch(url(key), {
        method: "PUT",
        body: new Blob([new Uint8Array(bytes)]),
        headers: { "content-type": contentType },
      });
      if (!res.ok) throw new Error(`S3 put failed: ${res.status} ${await res.text()}`);
    },
    async get(key) {
      const res = await client.fetch(url(key));
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`S3 get failed: ${res.status} ${await res.text()}`);
      return {
        bytes: new Uint8Array(await res.arrayBuffer()),
        contentType: res.headers.get("content-type") ?? "application/octet-stream",
      };
    },
    async del(key) {
      const res = await client.fetch(url(key), { method: "DELETE" });
      if (!res.ok && res.status !== 404)
        throw new Error(`S3 delete failed: ${res.status} ${await res.text()}`);
    },
    async presign(opts) {
      const target = new URL(url(opts.key));
      target.searchParams.set("X-Amz-Expires", String(opts.expires ?? 3600));
      const signed = await client.sign(
        new Request(target.toString(), { method: opts.method.toUpperCase() }),
        { aws: { signQuery: true } },
      );
      return signed.url;
    },
  };
}
