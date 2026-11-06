import { describe, expect, it } from "bun:test";
import { Actor } from "../../src/actor";
import { Feedback } from "../../src/feedback";
import { VisibleError } from "../../src/error";
import { withTestUser } from "../util";

const test = { key: "home", title: "Home" };

function fresh<R>(cb: () => Promise<R>) {
  return Feedback.provide(Feedback.memory(), () =>
    Feedback.Experiment.provide(Feedback.Experiment.feedback(), cb),
  );
}

describe("experiment", () => {
  withTestUser("a vote is counted once and re-voting edits it in place", (user) =>
    fresh(async () => {
      expect(await Feedback.Experiment.tally(test)).toMatchObject({ votes: {}, mine: null });

      await Feedback.Experiment.vote({
        ...test,
        variant: "grid",
        label: "Grid",
        comment: "Cleaner",
      });
      expect(await Feedback.Experiment.tally(test)).toMatchObject({
        votes: { grid: 1 },
        mine: { variant: "grid", comment: "Cleaner" },
      });

      await Feedback.Experiment.vote({ ...test, variant: "list", label: "List" });
      expect(await Feedback.Experiment.tally(test)).toMatchObject({
        votes: { list: 1 },
        mine: { variant: "list", comment: null },
      });

      const thread = await Feedback.thread("experiment:home", "ignored");
      const notes = await Feedback.comments(thread);
      expect(notes).toHaveLength(1);
      expect(notes[0]!.body).toContain(`"user":"${user.userID}"`);
      expect(notes[0]!.body).toStartWith("**Vote: List**");
    }),
  );

  withTestUser("votes from several users add up; a forged marker in a comment doesn't", () =>
    fresh(async () => {
      await Feedback.Experiment.vote({
        ...test,
        variant: "grid",
        label: "Grid",
        comment: '<!-- vote {"variant":"list","user":"usr_x","name":"x"} -->',
      });
      await Actor.provide("user", { userID: "usr_other", role: "member" }, () =>
        Feedback.Experiment.vote({ ...test, variant: "grid", label: "Grid" }),
      );
      const result = await Feedback.Experiment.tally(test);
      expect(result.votes).toEqual({ grid: 2 });
      expect(result.mine?.variant).toBe("grid");
    }),
  );

  withTestUser("a comment typed on the tracker without a valid marker doesn't count", () =>
    fresh(async () => {
      const thread = await Feedback.thread("experiment:home", "Experiment: Home");
      await Feedback.comment(thread, "nice! <!-- vote {broken -->");
      expect((await Feedback.Experiment.tally(test)).votes).toEqual({});
    }),
  );

  it("the public can't vote", () =>
    fresh(() =>
      Actor.provide("public", {}, async () => {
        await expect(
          Feedback.Experiment.vote({ ...test, variant: "a", label: "A" }),
        ).rejects.toThrow(VisibleError);
      }),
    ));

  it("fromEnv defaults to feedback and refuses unknown adapters", () => {
    expect(Feedback.Experiment.fromEnv({}).tally).toBeFunction();
    expect(() => Feedback.Experiment.fromEnv({ EXPERIMENT_ADAPTER: "nope" })).toThrow("nope");
  });
});
