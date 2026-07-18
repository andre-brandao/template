import { describe, expect } from "bun:test";
import { File } from "../src/file";
import { Storage } from "../src/storage";
import { User } from "../src/user";
import { Actor } from "../src/actor";
import { withTestUser } from "./util";

/** In-memory `Storage.Port` for tests — no filesystem/network involved. */
function memoryStorage(): Storage.Port {
  const objects = new Map<string, Storage.Object>();
  return {
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

function pngFile(name = "pixel.png") {
  return new File([new Uint8Array([1, 2, 3, 4])], name, { type: "image/png" });
}

describe("file", () => {
  withTestUser("upload validates and stores an image", async ({ userID }) => {
    await Storage.provide(memoryStorage(), async () => {
      const info = await File.upload({ file: pngFile() });
      expect(info.filename).toBe("pixel.png");
      expect(info.contentType).toBe("image/png");
      expect(info.userID).toBe(userID);
    });
  });

  withTestUser("upload rejects an unsupported mime type", async () => {
    await Storage.provide(memoryStorage(), async () => {
      const file = new File([new Uint8Array([1])], "note.txt", { type: "text/plain" });
      await expect(File.upload({ file })).rejects.toThrow();
    });
  });

  withTestUser("upload rejects a file that's too large", async () => {
    await Storage.provide(memoryStorage(), async () => {
      const big = new Uint8Array(6 * 1024 * 1024);
      const file = new File([big], "big.png", { type: "image/png" });
      await expect(File.upload({ file })).rejects.toThrow();
    });
  });

  withTestUser("fromID and content round-trip", async () => {
    await Storage.provide(memoryStorage(), async () => {
      const info = await File.upload({ file: pngFile() });
      const fetched = await File.fromID(info.id);
      expect(fetched?.id).toBe(info.id);

      const content = await File.content(info.id);
      expect(content?.contentType).toBe("image/png");
      expect(content?.bytes).toEqual(new Uint8Array([1, 2, 3, 4]));
    });
  });

  withTestUser("remove deletes the row and the storage object", async () => {
    await Storage.provide(memoryStorage(), async () => {
      const info = await File.upload({ file: pngFile() });
      await File.remove(info.id);
      expect(await File.fromID(info.id)).toBeNull();
      expect(await File.content(info.id)).toBeNull();
    });
  });

  withTestUser("a file isn't visible to another user", async () => {
    await Storage.provide(memoryStorage(), async () => {
      const info = await File.upload({ file: pngFile() });

      const otherID = await User.create({
        name: "Other",
        email: `test-${crypto.randomUUID()}@example.com`,
      });

      await Actor.provide("user", { userID: otherID }, async () => {
        expect(await File.fromID(info.id)).toBeNull();
        expect(await File.content(info.id)).toBeNull();
      });
    });
  });
});
