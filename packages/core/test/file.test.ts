import { describe, expect } from "bun:test";
import { File } from "../src/file";
import { User } from "../src/user";
import { Actor } from "../src/actor";
import { Organization } from "../src/organization";
import { Member } from "../src/organization/member";
import { withTestUser } from "./util";

/** In-memory `File.Port` for tests — no filesystem/network involved. */
function memory(): File.Port & { objects: Map<string, File.Object> } {
  const objects = new Map<string, File.Object>();
  return {
    objects,
    async put(key, bytes, contentType) {
      objects.set(key, { bytes, contentType });
    },
    async get(key) {
      return objects.get(key) ?? null;
    },
    async del(key) {
      objects.delete(key);
    },
  };
}

// `@cloudflare/workers-types` (pulled in by email/adapter/cloudflare.ts, part of this
// same program) redeclares ambient `File` without a construct signature. The runtime
// constructor is unaffected — only its declared type is broken by that global merge.
const FileCtor = globalThis.File as unknown as new (
  parts: Uint8Array[],
  name: string,
  options: { type: string },
) => globalThis.File;

function pngFile(name = "pixel.png") {
  return new FileCtor([new Uint8Array([1, 2, 3, 4])], name, { type: "image/png" });
}

describe("file", () => {
  withTestUser("upload stores a file", async ({ userID }) => {
    await File.provide(memory(), async () => {
      const info = await File.upload({ file: pngFile() });
      expect(info.filename).toBe("pixel.png");
      expect(info.contentType).toBe("image/png");
      expect(info.userID).toBe(userID);
      expect(info.tags).toEqual([]);
    });
  });

  withTestUser("upload accepts any content type", async () => {
    await File.provide(memory(), async () => {
      const file = new FileCtor([new Uint8Array([1])], "note.txt", { type: "text/plain" });
      const info = await File.upload({ file });
      expect(info.contentType).toStartWith("text/plain");
    });
  });

  withTestUser("upload rejects a file over the size cap", async () => {
    await File.provide(memory(), async () => {
      const big = new Uint8Array(21 * 1024 * 1024);
      const file = new FileCtor([big], "big.bin", { type: "application/octet-stream" });
      await expect(File.upload({ file })).rejects.toThrow("too large");
    });
  });

  withTestUser("tags are cleaned, stored, and filterable", async () => {
    await File.provide(memory(), async () => {
      const info = await File.upload({ file: pngFile(), tags: [" invoice ", "invoice", "2026"] });
      expect(info.tags).toEqual(["invoice", "2026"]);
      await File.upload({ file: pngFile("other.png") });

      const tagged = await File.list({ tags: ["invoice"] });
      expect(tagged.data.map((f) => f.id)).toEqual([info.id]);
      expect(tagged.total).toBe(1);

      const all = await File.list({});
      expect(all.total).toBe(2);
    });
  });

  withTestUser("list filters by filename search", async () => {
    await File.provide(memory(), async () => {
      await File.upload({ file: pngFile("report.png") });
      await File.upload({ file: pngFile("photo.png") });

      const hits = await File.list({ search: "repo" });
      expect(hits.data.map((f) => f.filename)).toEqual(["report.png"]);
    });
  });

  withTestUser("update renames and re-tags", async () => {
    await File.provide(memory(), async () => {
      const info = await File.upload({ file: pngFile() });
      const after = await File.update({ id: info.id, filename: "renamed.png", tags: ["done"] });
      expect(after.filename).toBe("renamed.png");
      expect(after.tags).toEqual(["done"]);
    });
  });

  withTestUser("fromID and content round-trip", async () => {
    await File.provide(memory(), async () => {
      const info = await File.upload({ file: pngFile() });
      const fetched = await File.fromID(info.id);
      expect(fetched?.id).toBe(info.id);

      const content = await File.content(info.id);
      expect(content?.contentType).toBe("image/png");
      expect(content?.bytes).toEqual(new Uint8Array([1, 2, 3, 4]));
    });
  });

  withTestUser("url is null without presign support", async () => {
    await File.provide(memory(), async () => {
      const info = await File.upload({ file: pngFile() });
      expect(await File.url({ id: info.id })).toBeNull();
    });
  });

  withTestUser("url returns a presigned link when the port signs", async () => {
    const port = { ...memory(), presign: async () => "https://signed.example/x" };
    await File.provide(port, async () => {
      const info = await File.upload({ file: pngFile() });
      expect(await File.url({ id: info.id })).toBe("https://signed.example/x");
    });
  });

  withTestUser("remove deletes the row and the storage object", async () => {
    const port = memory();
    await File.provide(port, async () => {
      const info = await File.upload({ file: pngFile() });
      await File.remove(info.id);
      expect(await File.fromID(info.id)).toBeNull();
      expect(await File.content(info.id)).toBeNull();
      expect(port.objects.size).toBe(0);
    });
  });

  withTestUser("a file isn't visible to another user", async () => {
    await File.provide(memory(), async () => {
      const info = await File.upload({ file: pngFile() });

      const otherID = await User.create({
        name: "Other",
        email: `test-${crypto.randomUUID()}@example.com`,
      });
      const otherOrg = await Organization.init({ userID: otherID, name: "Other Org" });
      const membership = await Member.resolve({ userID: otherID, orgID: otherOrg });

      await Actor.provide(
        "user",
        { userID: otherID, orgID: otherOrg, permissions: membership?.permissions },
        async () => {
          expect(await File.fromID(info.id)).toBeNull();
          expect(await File.content(info.id)).toBeNull();
          await expect(File.remove(info.id)).rejects.toThrow("not found");
        },
      );
    });
  });
});
