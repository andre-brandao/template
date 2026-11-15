import { z } from "zod";
import { fn } from "../../util/fn";
import { Assert } from "../../util/assert";
import { Identity } from "../../identity";
import { Examples } from "../../examples";
import { ErrorCodes, VisibleError } from "../../error";
import { Storage } from "../../lib/storage";
import { check } from "../../lib/storage/adapter/serve";
import { Signing } from "../key/signing";

/**
 * Objects on the caller's own storage prefix. There is no metadata table, so a key's
 * prefix *is* its owner: every op takes a bare filename and scopes it to `Identity.userID()`.
 */
export namespace File {
  const assert = Assert.create("File");

  /** `Storage.Entry` on the wire — what `list` can report about an object. */
  export const Info = z
    .object({
      key: z.string(),
      size: z.number(),
      lastModified: z.iso.datetime().nullable(),
    })
    .meta({
      ref: "File",
      description: "An object on the user's storage disk.",
      example: Examples.File,
    });

  /** `Storage.Meta` — an `Info` plus the content type, which only `head` knows. */
  export const Meta = Info.extend({ contentType: z.string() }).meta({
    ref: "FileMeta",
    description: "An object on the user's storage disk, with its content type.",
    example: { ...Examples.File, contentType: "image/png" },
  });

  export const MAX = 20 * 1024 * 1024;

  /** The filename becomes the key, so re-uploading the same name overwrites. */
  export const put = fn(
    z.file(),
    async (file) => {
      Identity.check({ file: ["create"] });
      if (file.size > MAX) invalid(`File too large: max ${MAX} bytes`);
      const at = key(file.name);
      await Storage.disk().put(
        at,
        new Uint8Array(await file.arrayBuffer()),
        file.type || "application/octet-stream",
      );
      return assert.exists(Storage.disk().head(at));
    },
    {
      title: "Upload file",
      description:
        "Multipart form with a `file` field. The filename becomes the key, so re-uploading the same name overwrites.",
    },
  );

  export const list = fn(
    z.void(),
    async () => {
      Identity.check({ file: ["read"] });
      const rows = await Storage.disk().list(`${Identity.userID()}/`);
      return rows.sort(
        (a, b) => (b.lastModified?.getTime() ?? 0) - (a.lastModified?.getTime() ?? 0),
      );
    },
    {
      title: "List files",
      description: "Everything under the user's prefix on the default disk, newest first.",
    },
  );

  /** A presigned URL when the disk can sign, null when the bytes have to be proxied. */
  export const url = fn(z.string(), (name) => {
    Identity.check({ file: ["read"] });
    return Storage.disk().temporaryUrl(key(name));
  });

  /** The bytes, whichever way they're served. */
  export const get = fn(
    z.string(),
    (name) => {
      Identity.check({ file: ["read"] });
      return assert.exists(Storage.disk().get(key(name)));
    },
    {
      title: "Get file content",
      description:
        "Redirects to a presigned storage URL when the disk supports it; streams the bytes otherwise.",
    },
  );

  /** Serves a link minted by a disk that can't presign. The signature is the credential. */
  export const signed = fn(
    z.object({ key: z.string(), expires: z.number(), kid: z.string(), sig: z.string() }),
    async (input) => {
      const secret = await Signing.secret(input.kid);
      if (!secret || !(await check(input, secret)))
        throw new VisibleError(
          "forbidden",
          ErrorCodes.Permission.FORBIDDEN,
          "This link is invalid or has expired",
        );
      return assert.exists(Storage.disk().get(input.key));
    },
    {
      title: "Get signed file content",
      description:
        "Serves the bytes for a `temporaryUrl` minted by a disk that can't presign (fs, R2 binding). The signature stands in for the session, so no token is needed.",
    },
  );

  export const rename = fn(
    z.object({ from: z.string(), to: z.string().trim().min(1).max(255) }),
    async (input) => {
      Identity.check({ file: ["update"] });
      const from = key(input.from);
      const to = key(input.to);
      await assert.exists(Storage.disk().head(from));
      await Storage.disk().move(from, to);
      return assert.exists(Storage.disk().head(to));
    },
    { title: "Rename file", description: "Moves the object to a new key under the same prefix." },
  );

  /** Deleting a missing key is a no-op on every disk, so there's no miss to report. */
  export const remove = fn(
    z.string(),
    async (name) => {
      Identity.check({ file: ["delete"] });
      await Storage.disk().delete(key(name));
    },
    { title: "Delete file" },
  );

  // === UTILS ===

  /** `name` comes off a filename, so it's flattened to a basename — `../` would walk out. */
  function key(name: string) {
    const base = name.split(/[\\/]/).at(-1)?.trim();
    if (!base || base === "." || base === "..") invalid(`Invalid filename: ${name}`);
    return `${Identity.userID()}/${base}`;
  }

  function invalid(message: string): never {
    throw new VisibleError("validation", ErrorCodes.Validation.INVALID_PARAMETER, message);
  }
}
