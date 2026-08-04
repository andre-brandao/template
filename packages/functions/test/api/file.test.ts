import { describe, expect } from "bun:test";
import { setupApiTest } from "./util";
import { app } from "../../src/api/routes";
import { User } from "@template/core/user";
import { Key } from "@template/core/key";
import { Storage } from "@template/core/storage";
import { serve } from "@template/core/storage/adapter/serve";

// 1x1 transparent PNG.
const PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

/** `Storage.Entry`/`Meta` after JSON — `lastModified` arrives as an ISO string. */
type Entry = { key: string; size: number; lastModified: string | null };
type Meta = Entry & { contentType: string };

function pngFile(name = "pixel.png") {
  return new File([Buffer.from(PNG_BASE64, "base64")], name, { type: "image/png" });
}

const { test, postForm, get, del, patch, noAuth, expectError, userID } = setupApiTest();

async function upload(file: File) {
  const form = new FormData();
  form.append("file", file);
  return (await postForm("/file", form)).json() as Promise<Meta>;
}

describe("file", () => {
  test("POST /file stores the object under the user's prefix", async () => {
    const body = await upload(pngFile("stored.png"));
    expect(body.key).toBe(`${userID()}/stored.png`);
    expect(body.size).toBe(Buffer.from(PNG_BASE64, "base64").length);
    expect(body.contentType).toBe("image/png");
    expect(body.lastModified).toBeString();
  });

  test("POST /file accepts any content type", async () => {
    const body = await upload(new File(["hello"], "note.txt", { type: "text/plain" }));
    expect(body.contentType).toStartWith("text/plain");
  });

  test("POST /file flattens a traversing filename to a basename", async () => {
    const body = await upload(pngFile("../../escape.png"));
    expect(body.key).toBe(`${userID()}/escape.png`);
    expect(await Storage.disk().head("escape.png")).toBeNull();
  });

  test("GET /file lists the user's own objects", async () => {
    await upload(pngFile("listed.png"));
    const rows = (await (await get("/file")).json()) as Entry[];
    expect(rows.map((row) => row.key)).toContain(`${userID()}/listed.png`);
  });

  test("PATCH /file/:name renames the object", async () => {
    await upload(pngFile("before.png"));

    const response = await patch("/file/before.png", { name: "after.png" });
    expect(response.status).toBe(200);
    expect(((await response.json()) as Meta).key).toBe(`${userID()}/after.png`);

    expect((await get("/file/after.png/content")).status).toBe(200);
    await expectError(await get("/file/before.png/content"), 404);
  });

  test("PATCH /file/:name 404s for an object that isn't there", async () => {
    await expectError(await patch("/file/ghost.png", { name: "other.png" }), 404);
  });

  test("GET /file/:name/content round-trips the bytes", async () => {
    await upload(pngFile("roundtrip.png"));

    const content = await get("/file/roundtrip.png/content");
    expect(content.status).toBe(200);
    expect(content.headers.get("content-type")).toBe("image/png");
    expect(new Uint8Array(await content.arrayBuffer())).toEqual(
      new Uint8Array(Buffer.from(PNG_BASE64, "base64")),
    );
  });

  test("DELETE /file/:name removes it", async () => {
    await upload(pngFile("doomed.png"));

    expect((await del("/file/doomed.png")).status).toBe(200);
    await expectError(await get("/file/doomed.png/content"), 404);
  });

  test("GET /file/signed serves bytes for a signed link and refuses a tampered one", async () => {
    // Signed against the same disk the route reads from, so the bytes are actually there.
    const disk = serve(Storage.fake(), {
      url: "http://localhost/file/signed",
      key: Key.signing,
    });

    await Storage.provide(disk, async () => {
      await Storage.disk().put("usr_x/note.txt", new TextEncoder().encode("hi"), "text/plain");
      const url = (await Storage.disk().temporaryUrl("usr_x/note.txt", { expires: 60 }))!;

      // No authorization header — the signature is the credential.
      const response = await noAuth(url);
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("text/plain");
      expect(await response.text()).toBe("hi");

      await expectError(await noAuth(url.replace(/sig=.*/, "sig=forged")), 403);
    });
  });

  test("another user's prefix is a different namespace", async () => {
    await upload(pngFile("private.png"));

    const otherEmail = `test-${crypto.randomUUID()}@example.com`;
    const otherUserID = await User.create({ name: "Other User", email: otherEmail });
    const otherToken = (await Key.create({ userID: otherUserID, name: "other" })).key;
    const headers = { authorization: `Bearer ${otherToken}` };

    await expectError(await app.request("/file/private.png/content", { headers }), 404);

    const rows = (await (await app.request("/file", { headers })).json()) as Entry[];
    expect(rows).toBeEmpty();
  });
});
