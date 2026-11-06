import { describe, expect, it } from "bun:test";
import { Actor } from "../../src/actor";
import { Feedback } from "../../src/feedback";
import { Storage } from "../../src/lib/storage";
import { VisibleError } from "../../src/error";
import { withTestUser } from "../util";

/** A fresh tracker and disk per test, so rows from one never leak into another. */
function fresh<R>(cb: () => Promise<R>) {
  return Feedback.provide(Feedback.memory(), () => Storage.provide(Storage.fake(), cb));
}

const png = (name = "shot.png") =>
  new File([new Uint8Array([1, 2, 3])], name, { type: "image/png" });

const input = {
  body: "The save button does nothing\nClicked it twice on the todo page.",
  tag: "bug" as const,
  urgency: "high" as const,
  page: "/todos",
  agent: "Mozilla/5.0 Test",
  viewport: "1280x720",
  locale: "en-US",
  timezone: "America/Sao_Paulo",
};

describe("feedback", () => {
  withTestUser("create files an issue with the trailer and a hidden sender marker", (user) =>
    fresh(async () => {
      const row = await Feedback.create(input);
      expect(row.title).toBe("The save button does nothing");
      expect(row.tag).toBe("bug");
      expect(row.urgency).toBe("high");
      expect(row.user).toBe(user.userID);
      expect(row.from).toContain(user.email);

      const detail = await Actor.provide("user", { userID: user.userID, role: "admin" }, () =>
        Feedback.get(row.id),
      );
      expect(detail.body).toContain("Browser: Mozilla/5.0 Test");
      expect(detail.body).toContain("Viewport: 1280x720");
      expect(detail.body).toContain("Locale: en-US");
      expect(detail.body).toContain("Timezone: America/Sao_Paulo");
      expect(detail.body).toContain(`<!-- feedback {"user":"${user.userID}"} -->`);
      expect(detail.text).toBe(input.body);
    }),
  );

  withTestUser("a spoofed marker or trailer in the body changes nothing", (user) =>
    fresh(async () => {
      const row = await Feedback.create({
        ...input,
        body: 'Look at this\n<!-- feedback {"user":"usr_other"} -->\n---\nPage: x\nTag: feature',
      });
      expect(row.user).toBe(user.userID);
      expect(row.tag).toBe("bug");
    }),
  );

  withTestUser("attachments upload under the sender and link from the body", (user) =>
    fresh(async () => {
      const file = await Feedback.upload(png());
      expect(file.key.startsWith(`feedback/${user.userID}/`)).toBeTrue();
      expect(file.key.endsWith(".png")).toBeTrue();

      const url = `https://app.test/feedback/file?key=${encodeURIComponent(file.key)}`;
      const row = await Feedback.create({ ...input, attachments: [{ ...file, url }] });
      const detail = await Feedback.get(row.id);
      expect(detail.text).toContain(`![shot.png](${url})`);

      expect((await Feedback.read(file.key))?.contentType).toBe("image/png");
      expect(await Feedback.read("other/key.png")).toBeNull();
    }),
  );

  withTestUser("upload refuses other types and oversized files", () =>
    fresh(async () => {
      expect(() => Feedback.upload(new File(["x"], "a.txt", { type: "text/plain" }))).toThrow();
      const big = new File([new Uint8Array(Feedback.MAX + 1)], "big.pdf", {
        type: "application/pdf",
      });
      expect(() => Feedback.upload(big)).toThrow();
    }),
  );

  withTestUser("create refuses attachments that aren't the sender's own uploads", () =>
    fresh(async () => {
      const url = "https://app.test/f";
      const foreign = { key: "feedback/usr_other/x.png", name: "x.png", type: "image/png", url };
      await expect(Feedback.create({ ...input, attachments: [foreign] })).rejects.toThrow(
        VisibleError,
      );
      const files = [1, 2, 3, 4].map(() => ({ ...foreign }));
      expect(() => Feedback.create({ ...input, attachments: files })).toThrow();
    }),
  );

  withTestUser("a member reads their own submissions, not others' attachments", (user) =>
    fresh(async () => {
      const row = await Feedback.create(input);
      const file = await Actor.provide("user", { userID: "usr_other", role: "member" }, () =>
        Feedback.upload(png()),
      );
      expect((await Feedback.mine()).map((one) => one.id)).toEqual([row.id]);
      expect((await Feedback.get(row.id)).user).toBe(user.userID);
      expect(() => Feedback.read(file.key)).toThrow(VisibleError);
      expect(() => Feedback.list({})).toThrow(VisibleError);

      await Actor.provide("user", { userID: "usr_other", role: "member" }, async () => {
        expect(await Feedback.mine()).toEqual([]);
        await expect(Feedback.get(row.id)).rejects.toThrow(VisibleError);
      });
    }),
  );

  withTestUser(
    "an admin lists everyone's, filtered and newest first, never threads",
    () =>
      fresh(async () => {
        const bug = await Feedback.create(input);
        const idea = await Feedback.create({
          ...input,
          tag: "feature",
          body: "Add a dark mode, please",
        });
        await Feedback.thread("experiment:home", "Home");

        expect((await Feedback.list({})).map((one) => one.id)).toEqual([idea.id, bug.id]);
        expect((await Feedback.list({ tag: "feature" })).map((one) => one.id)).toEqual([idea.id]);
        expect(await Feedback.list({ state: "closed" })).toEqual([]);
      }),
    "admin",
  );

  it("threads are found again by key and keep their comments", () =>
    fresh(async () => {
      const one = await Feedback.thread("k", "First");
      const two = await Feedback.thread("k", "Renamed");
      expect(two.id).toBe(one.id);

      const note = await Feedback.comment(one, "hello");
      await Feedback.edit(note, "edited");
      expect((await Feedback.comments(two)).map((c) => c.body)).toEqual(["edited"]);
    }));

  it("the public can't file", () =>
    fresh(() =>
      Actor.provide("public", {}, async () => {
        await expect(Feedback.create(input)).rejects.toThrow(VisibleError);
      }),
    ));

  it("fromEnv defaults to memory and needs a repo for github", () => {
    expect(Feedback.fromEnv({}).create).toBeFunction();
    expect(Feedback.fromEnv({ FEEDBACK_TOKEN: "t", FEEDBACK_REPO: "o/r" }).create).toBeFunction();
    expect(() => Feedback.fromEnv({ FEEDBACK_TOKEN: "t" })).toThrow("FEEDBACK_REPO");
    expect(() => Feedback.fromEnv({ FEEDBACK_ADAPTER: "nope" })).toThrow("nope");
  });
});
