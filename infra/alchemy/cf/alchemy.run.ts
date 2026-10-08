import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Planetscale from "alchemy/Planetscale";
import * as RemovalPolicy from "alchemy/RemovalPolicy";
import { Stack } from "alchemy/Stack";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { migrate } from "./database";
import { workers } from "./workers";

export default Alchemy.Stack(
  "template-alc",
  {
    providers: Layer.mergeAll(Cloudflare.providers(), Planetscale.providers()),
    state: Cloudflare.state(),
  },
  Effect.gen(function* () {
    const stack = yield* Stack;
    return yield* Effect.gen(function* () {
      yield* migrate;
      return yield* workers;
    }).pipe(RemovalPolicy.retain(stack.stage === "prod"));
  }),
);
