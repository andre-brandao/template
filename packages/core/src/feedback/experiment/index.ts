import { z } from "zod";
import { Actor } from "../../actor";
import { User } from "../../user";
import { fn } from "../../util/fn";
import { feedback as store } from "./adapter/feedback";
import * as driver from "./driver";
import type * as port from "./port";

/**
 * Layout A/B tests the people using a page vote on. Votes go through a swappable adapter;
 * the default keeps them as comments on one Feedback thread per experiment.
 */
export namespace Experiment {
  export type Adapter = port.Adapter;
  export type Ballot = port.Ballot;
  export type Tally = port.Tally;
  export type Vote = port.Vote;

  export const provide = driver.provide;
  export const use = driver.use;
  export const fromEnv = driver.fromEnv;
  export const feedback = store;

  // Taking part in an experiment is giving feedback, so it rides on that grant.
  const Test = z.object({
    key: z.string().min(1).max(64).meta({ description: "Stable id of the experiment." }),
    title: z
      .string()
      .min(1)
      .max(200)
      .meta({ description: "Human name, used when it is first seen." }),
  });

  const Variant = z.string().min(1).max(64).meta({ description: "Slug of the variant." });

  /** Votes per variant and the actor's own. */
  export const tally = fn(Test, (input) => {
    Actor.check({ feedback: ["create"] });
    return driver.use().tally(input.key, input.title, Actor.userID());
  });

  /** One vote per user: a first vote creates it, the next ones replace it. */
  export const vote = fn(
    Test.extend({
      variant: Variant,
      label: z.string().min(1).max(100).meta({ description: "Human name of the variant." }),
      comment: z.string().trim().max(2000).optional().meta({ description: "Why, optionally." }),
    }),
    async (input) => {
      Actor.check({ feedback: ["create"] });
      const id = Actor.userID();
      const user = await User.fromID(id);
      await driver.use().vote({ ...input, user: { id, name: user?.name ?? "" } });
    },
  );

  /** Reports that the actor saw `variant`; a no-op unless the adapter counts exposures. */
  export const expose = fn(z.object({ key: Test.shape.key, variant: Variant }), (input) => {
    Actor.check({ feedback: ["create"] });
    driver.use().expose?.(input.key, input.variant, Actor.userID());
  });
}
