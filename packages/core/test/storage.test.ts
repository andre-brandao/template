import { describe, expect, it } from "bun:test";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { rm } from "node:fs/promises";
import { Storage } from "../src/lib/storage";
import { fs } from "../src/lib/storage/adapter/fs";
import { check, serve } from "../src/lib/storage/adapter/serve";
import { sign } from "../src/util/sign";

function stub(tag: string): Storage.Disk {
  return {
    ...Storage.fake(),
    async get() {
      return { bytes: new TextEncoder().encode(tag), contentType: "text/plain" };
    },
  };
}

const bytes = (text: string) => new TextEncoder().encode(text);

const tmp = join(tmpdir(), `template-storage-${crypto.randomUUID()}`);

/** Every driver has to behave the same, so the derived API is exercised against each. */
const drivers = {
  fake: () => Storage.fake(),
  fs: () => fs({ dir: tmp }),
};

async function read(disk: Storage.Disk) {
  return new TextDecoder().decode((await disk.get("k"))!.bytes);
}

describe("storage", () => {
  it("a lone disk becomes the default", async () => {
    await Storage.provide(stub("only"), async () => {
      expect(await read(Storage.disk())).toBe("only");
    });
  });

  it("named disks resolve, default is the one configured", async () => {
    const disks = { default: "b", disks: { a: stub("a"), b: stub("b") } };
    await Storage.provide(disks, async () => {
      expect(await read(Storage.disk("a"))).toBe("a");
      expect(await read(Storage.disk())).toBe("b");
      expect(() => Storage.disk("nope")).toThrow("Unknown storage disk: nope");
    });
  });

  it("falls back to env when nothing is provided", () => {
    expect(Storage.disk().put).toBeFunction();
  });

  it("fromEnv builds fs by default and s3 when configured", () => {
    expect(Storage.fromEnv({}).default).toBe("fs");

    const s3 = Storage.fromEnv({
      STORAGE_DISK: "s3",
      S3_ENDPOINT: "https://example.com",
      S3_BUCKET: "bucket",
      S3_ACCESS_KEY_ID: "id",
      S3_SECRET_ACCESS_KEY: "secret",
    });
    expect(s3.default).toBe("s3");
    expect(s3.disks.s3?.presign).toBeFunction();
    expect(s3.disks.fs).toBeDefined();

    expect(() => Storage.fromEnv({ STORAGE_DISK: "s3" })).toThrow("Missing S3_ENDPOINT");
  });

  it("serve() signs a route for disks that can't presign", async () => {
    const signed = serve(Storage.fake(), {
      url: "https://api.example.com/file/signed",
      key: async () => ({ id: "key_01", secret: "shh" }),
    });

    await Storage.provide(signed, async () => {
      const url = new URL((await Storage.disk().temporaryUrl("usr_1/fil_2", { expires: 60 }))!);
      expect(url.origin + url.pathname).toBe("https://api.example.com/file/signed");
      expect(url.searchParams.get("key")).toBe("usr_1/fil_2");
      expect(url.searchParams.get("kid")).toBe("key_01");

      const params = {
        key: url.searchParams.get("key")!,
        expires: Number(url.searchParams.get("expires")),
        sig: url.searchParams.get("sig")!,
      };
      expect(await check(params, "shh")).toBeTrue();
      expect(await check(params, "wrong-secret")).toBeFalse();
      expect(await check({ ...params, key: "usr_1/other" }, "shh")).toBeFalse();
      expect(await check({ ...params, expires: params.expires + 60 }, "shh")).toBeFalse();
    });
  });

  it("a signature that has run out of time is refused", async () => {
    const stale = Math.floor(Date.now() / 1000) - 1;
    const sig = await sign("shh", "usr_1/fil_2", stale);
    expect(await check({ key: "usr_1/fil_2", expires: stale, sig }, "shh")).toBeFalse();
  });

  it("temporaryUrl is null when the driver can't sign, signed when it can", async () => {
    await Storage.provide(Storage.fake(), async () => {
      expect(await Storage.disk().temporaryUrl("k")).toBeNull();
    });

    const signer = { ...Storage.fake(), presign: async () => "https://signed.example/x" };
    await Storage.provide(signer, async () => {
      expect(await Storage.disk().temporaryUrl("k", { expires: 60 })).toBe(
        "https://signed.example/x",
      );
    });
  });
});

describe.each(Object.entries(drivers))("storage disk (%s)", (name, make) => {
  const disk = make();

  it("round-trips bytes with their content type", async () => {
    await Storage.provide(disk, async () => {
      await Storage.disk().put("a/one.txt", bytes("hello"), "text/plain");
      const object = await Storage.disk().get("a/one.txt");
      expect(new TextDecoder().decode(object!.bytes)).toBe("hello");
      expect(object!.contentType).toBe("text/plain");
      expect(await Storage.disk().get("a/missing.txt")).toBeNull();
    });
  });

  it("reports exists, missing, size, mimeType and lastModified", async () => {
    await Storage.provide(disk, async () => {
      await Storage.disk().put("a/two.txt", bytes("four"), "text/plain");

      expect(await Storage.disk().exists("a/two.txt")).toBeTrue();
      expect(await Storage.disk().missing("a/two.txt")).toBeFalse();
      expect(await Storage.disk().size("a/two.txt")).toBe(4);
      expect(await Storage.disk().mimeType("a/two.txt")).toBe("text/plain");
      expect(await Storage.disk().lastModified("a/two.txt")).toBeInstanceOf(Date);

      expect(await Storage.disk().exists("a/gone.txt")).toBeFalse();
      expect(await Storage.disk().missing("a/gone.txt")).toBeTrue();
      expect(await Storage.disk().size("a/gone.txt")).toBeNull();
      expect(await Storage.disk().head("a/gone.txt")).toBeNull();
    });
  });

  it("lists keys under a prefix", async () => {
    await Storage.provide(disk, async () => {
      await Storage.disk().put("b/one.txt", bytes("1"), "text/plain");
      await Storage.disk().put("b/two.txt", bytes("2"), "text/plain");
      await Storage.disk().put("c/three.txt", bytes("3"), "text/plain");

      expect((await Storage.disk().files("b/")).sort()).toEqual(["b/one.txt", "b/two.txt"]);
      expect(await Storage.disk().files("nothing/")).toBeEmpty();

      const rows = await Storage.disk().list("c/");
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ key: "c/three.txt", size: 1 });
    });
  });

  it("copies and moves", async () => {
    await Storage.provide(disk, async () => {
      await Storage.disk().put("d/src.txt", bytes("body"), "text/plain");

      await Storage.disk().copy("d/src.txt", "d/copy.txt");
      expect(await Storage.disk().mimeType("d/copy.txt")).toBe("text/plain");
      expect(await Storage.disk().exists("d/src.txt")).toBeTrue();

      await Storage.disk().move("d/src.txt", "d/moved.txt");
      expect(await Storage.disk().exists("d/moved.txt")).toBeTrue();
      expect(await Storage.disk().exists("d/src.txt")).toBeFalse();

      await expect(Storage.disk().copy("d/gone.txt", "d/x.txt")).rejects.toThrow("No such key");
    });
  });

  it("delete is idempotent", async () => {
    await Storage.provide(disk, async () => {
      await Storage.disk().put("e/one.txt", bytes("x"), "text/plain");
      await Storage.disk().delete("e/one.txt");
      await Storage.disk().delete("e/one.txt");
      expect(await Storage.disk().exists("e/one.txt")).toBeFalse();
    });

    if (name === "fs") await rm(tmp, { recursive: true, force: true });
  });
});
