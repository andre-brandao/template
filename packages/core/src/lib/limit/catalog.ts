import { digest, encode } from "../../util/hash";
import { Kv } from "../kv";
import { Exceeded } from "./error";
import type { Algorithm, Policy, Rule, Subject } from "./port";

export type Built<Tree> = {
  [Key in keyof Tree]: Tree[Key] extends Policy<infer _Options>
    ? Rule
    : Tree[Key] extends Record<string, unknown>
      ? Built<Tree[Key]>
      : never;
};

export function subject(kind: string, value: string): Subject {
  if (!kind || !value) throw new Error("A rate-limit subject needs a kind and value");
  return { kind, value };
}

/** Turns nested policy data into a catalog while preserving every path in its type. */
export function catalog<const Tree extends Record<string, unknown>>(tree: Tree): Built<Tree> {
  return build(tree) as Built<Tree>;
}

function build(tree: Record<string, unknown>, path: string[] = []): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(tree).map(([name, value]) => {
      if (!value || typeof value !== "object" || Array.isArray(value))
        throw new Error(`Invalid rate-limit catalog entry ${[...path, name].join(".")}`);

      const next = value as Record<string, unknown>;
      if (!("algorithm" in next) || !("options" in next))
        return [name, build(next, [...path, name])];

      const policy = next as { algorithm: Algorithm<unknown>; options: unknown };
      return [name, rule([...path, name].join("."), policy)];
    }),
  );
}

function rule(id: string, policy: Policy<unknown>): Rule {
  const key = async (subject: Subject) =>
    `limit:v1:${id}:${encode(await digest(`${subject.kind}:${subject.value}`))}`;

  return {
    async consume(subject, opts = {}) {
      const cost = opts.cost ?? 1;
      if (!Number.isSafeInteger(cost) || cost < 1)
        throw new Error("Rate-limit cost must be a positive integer");
      const result = await policy.algorithm.consume(
        Kv.use(),
        await key(subject),
        policy.options,
        cost,
      );
      if (!result.allowed) throw new Exceeded(result);
      return result;
    },
    async inspect(subject) {
      return policy.algorithm.inspect(Kv.use(), await key(subject), policy.options);
    },
    async reset(subject) {
      await policy.algorithm.reset(Kv.use(), await key(subject), policy.options);
    },
  };
}
