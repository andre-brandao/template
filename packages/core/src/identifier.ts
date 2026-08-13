import { ulid } from "ulid";
import { z } from "zod";

export namespace Identifier {
  export const prefixes = {
    user: "usr",
    provider: "prv",
    project: "prj",
    todo: "tod",
    key: "key",
    event: "evt",
    job: "job",
    webhook: "whk",
  } as const;

  export function create(prefix: keyof typeof prefixes, given?: string): string {
    if (given) {
      if (given.startsWith(prefixes[prefix])) return given;
      throw new Error(`ID ${given} does not start with ${prefixes[prefix]}`);
    }
    return [prefixes[prefix], ulid()].join("_");
  }

  export function schema(prefix: keyof typeof prefixes) {
    return z.string().startsWith(prefixes[prefix]);
  }
}
