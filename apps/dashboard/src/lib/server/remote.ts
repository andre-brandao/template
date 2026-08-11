import { command, form, query } from "$app/server";
import { error, invalid, redirect } from "@sveltejs/kit";
import type { z } from "zod";
import { Actor } from "@template/core/actor";
import { VisibleError } from "@template/core/error";

export function auth() {
  if (Actor.use().type !== "user") redirect(303, "/login");
}

// Schema validation only catches malformed input — business errors (invalid
// credentials, not found, ...) are only known once the core function actually
// runs. This turns a thrown `VisibleError` into a form-wide `invalid()` issue,
// shown via `fields.allIssues()`; anything else fails as a normal SvelteKit
// error response.
//
// A denial is the exception: it isn't something the user can fix by editing the
// form, so it renders as the error page rather than a phantom field issue.
export async function guard<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof VisibleError) {
      if (err.type === "forbidden") error(403, err.message);
      invalid(err.message);
    }
    error(500, "Internal Error");
  }
}

type Gate = () => void | Promise<void>;

async function run(gates: Gate[]) {
  for (const gate of gates) await gate();
}

export function remote<S extends z.ZodType, R>(
  core: ((input: z.infer<S>) => R) & { schema: S },
  gates: Gate[] = [auth],
  schema: any = core.schema,
) {
  const guarded = async (input: z.infer<S>) => {
    await run(gates);
    return guard(async () => core(input));
  };
  return {
    query: () => query(schema, guarded),
    form: () => form(schema, guarded),
    command: () => command(schema, guarded),
    public: () =>
      remote(
        core,
        gates.filter((gate) => gate !== auth),
        schema,
      ),
    use: (gate: Gate) => remote(core, [...gates, gate], schema),
    with: (next: z.ZodType<z.infer<S>>) => remote(core, gates, next),
  };
}
