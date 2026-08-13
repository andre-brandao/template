import { AwsClient } from "aws4fetch";
import type { Disk, Entry } from "../port";

export type Config = {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
};

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
};

/** First match of `<name>…</name>`, unescaped. Enough for ListObjectsV2's flat shape. */
function tag(xml: string, name: string) {
  const hit = xml.match(new RegExp(`<${name}>(.*?)</${name}>`, "s"))?.[1] ?? "";
  return hit.replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g, (found) => ENTITIES[found] ?? found);
}

function date(value: string | null) {
  return value ? new Date(value) : null;
}

/** S3-compatible disk (AWS S3 or R2 via access keys) via `aws4fetch`, path-style requests. */
export function s3(opts: Config): Disk {
  const client = new AwsClient({
    accessKeyId: opts.accessKeyId,
    secretAccessKey: opts.secretAccessKey,
    region: opts.region,
    service: "s3",
  });

  const escape = (key: string) => key.split("/").map(encodeURIComponent).join("/");
  const root = opts.endpoint.replace(/\/$/, "");
  const url = (key: string) => `${root}/${opts.bucket}/${escape(key)}`;

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
    async delete(key) {
      const res = await client.fetch(url(key), { method: "DELETE" });
      if (!res.ok && res.status !== 404)
        throw new Error(`S3 delete failed: ${res.status} ${await res.text()}`);
    },
    async head(key) {
      const res = await client.fetch(url(key), { method: "HEAD" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`S3 head failed: ${res.status}`);
      return {
        key,
        size: Number(res.headers.get("content-length") ?? 0),
        contentType: res.headers.get("content-type") ?? "application/octet-stream",
        lastModified: date(res.headers.get("last-modified")),
      };
    },
    async list(prefix) {
      const found: Entry[] = [];
      let token: string | undefined;

      do {
        const target = new URL(`${root}/${opts.bucket}`);
        target.searchParams.set("list-type", "2");
        if (prefix) target.searchParams.set("prefix", prefix);
        if (token) target.searchParams.set("continuation-token", token);

        const res = await client.fetch(target.toString());
        if (!res.ok) throw new Error(`S3 list failed: ${res.status} ${await res.text()}`);
        const xml = await res.text();

        found.push(
          ...[...xml.matchAll(/<Contents>(.*?)<\/Contents>/gs)]
            .map((hit) => hit[1] ?? "")
            .map((row) => ({
              key: tag(row, "Key"),
              size: Number(tag(row, "Size")),
              lastModified: date(tag(row, "LastModified")),
            })),
        );
        token = xml.includes("<IsTruncated>true</IsTruncated>")
          ? tag(xml, "NextContinuationToken")
          : undefined;
      } while (token);

      return found;
    },
    async copy(from, to) {
      const res = await client.fetch(url(to), {
        method: "PUT",
        headers: { "x-amz-copy-source": `/${opts.bucket}/${escape(from)}` },
      });
      if (!res.ok) throw new Error(`S3 copy failed: ${res.status} ${await res.text()}`);
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
