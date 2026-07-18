import { describe, expect } from "bun:test";
import { setupApiTest } from "./util";
import { app } from "../../src/api/routes";
import { User } from "@template/core/user";
import { Key } from "@template/core/key";
import type { File as FileInfo } from "@template/core/file";

// 1x1 transparent PNG.
const PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

function pngFile(name = "pixel.png") {
  return new File([Buffer.from(PNG_BASE64, "base64")], name, { type: "image/png" });
}

const json = (res: Response) => res.json() as Promise<FileInfo.Info>;

const { test, postForm, get, del, expectError } = setupApiTest();

describe("file", () => {
  test("POST /file uploads an image", async () => {
    const form = new FormData();
    form.append("file", pngFile());
    const response = await postForm("/file", form);
    expect(response.status).toBe(200);
    const body = await json(response);
    expect(body.filename).toBe("pixel.png");
    expect(body.contentType).toBe("image/png");
  });

  test("POST /file rejects an unsupported type", async () => {
    const form = new FormData();
    form.append("file", new File(["hello"], "note.txt", { type: "text/plain" }));
    const response = await postForm("/file", form);
    await expectError(response, 400);
  });

  test("GET /file/:id and /file/:id/content round-trip", async () => {
    const form = new FormData();
    form.append("file", pngFile());
    const uploaded = await json(await postForm("/file", form));

    const meta = await json(await get(`/file/${uploaded.id}`));
    expect(meta.id).toBe(uploaded.id);

    const content = await get(`/file/${uploaded.id}/content`);
    expect(content.status).toBe(200);
    expect(content.headers.get("content-type")).toBe("image/png");
    expect(new Uint8Array(await content.arrayBuffer())).toEqual(
      new Uint8Array(Buffer.from(PNG_BASE64, "base64")),
    );
  });

  test("DELETE /file/:id removes it", async () => {
    const form = new FormData();
    form.append("file", pngFile());
    const uploaded = await json(await postForm("/file", form));

    await del(`/file/${uploaded.id}`);
    await expectError(await get(`/file/${uploaded.id}`), 404);
  });

  test("a file is not visible to another user", async () => {
    const form = new FormData();
    form.append("file", pngFile());
    const uploaded = await json(await postForm("/file", form));

    const otherEmail = `test-${crypto.randomUUID()}@example.com`;
    const otherUserID = await User.create({ name: "Other User", email: otherEmail });
    const otherToken = (await Key.create({ userID: otherUserID, name: "other" })).key;

    const response = await app.request(`/file/${uploaded.id}`, {
      headers: { authorization: `Bearer ${otherToken}` },
    });
    await expectError(response, 404);
  });
});
