import { command, form, query } from "$app/server";
import { error, invalid, redirect } from "@sveltejs/kit";
import type { RemoteForm, RemoteFormInput } from "@sveltejs/kit";
import type { z } from "zod";
import { Actor } from "@template/core/actor";
import { VisibleError } from "@template/core/error";

function auth() {
  if (Actor.use().type !== "user") redirect(303, "/login");
}

/** How a `VisibleError` gets out: as a form issue, or thrown for the caller to catch. */
type Mode = "form" | "throw";

// Turns a thrown `VisibleError` into a form-wide `invalid()` issue; anything else is a
// normal SvelteKit error. A denial isn't fixable by editing the form, so it renders as
// the error page instead. Only a form can hold issues — a query or a command has nowhere
// to put them, so there the message travels back as the error for the caller to surface.
async function guard<T>(fn: () => Promise<T>, mode: Mode): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof VisibleError) {
      if (err.type === "forbidden") error(403, err.message);
      if (mode === "throw") error(400, err.message);
      invalid(err.message);
    }
    error(500, "Internal Error");
  }
}

// `form` types its schema through a conditional that only resolves once the schema is
// concrete, so a generic one never gets past it. The delegation is bridged here, and the
// form-input shape is asserted on the way out — a schema that cannot back a form yields a
// `RemoteForm<never>` that fails at its first field.
const build = form as <Parsed, Raw, Result>(
  schema: z.ZodType<Parsed, Raw>,
  run: (input: Parsed) => Promise<Result>,
) => RemoteForm<Raw extends RemoteFormInput | void ? Raw : never, Result>;

type Gate = () => void | Promise<void>;

async function run(gates: Gate[]) {
  for (const gate of gates) await gate();
}

function core<Parsed, Raw, Result>(
  fn: (input: Parsed) => Result,
  schema: z.ZodType<Parsed, Raw>,
  gates: Gate[] = [auth],
) {
  const guarded = (mode: Mode) => async (input: Parsed) => {
    await run(gates);
    return guard(async () => fn(input), mode);
  };
  return {
    query: () => query(schema, guarded("throw")),
    form: () => build(schema, guarded("form")),
    command: () => command(schema, guarded("throw")),
    public: () =>
      core(
        fn,
        schema,
        gates.filter((gate) => gate !== auth),
      ),
    use: (gate: Gate) => core(fn, schema, [...gates, gate]),
    with: <Next>(next: z.ZodType<Parsed, Next>) => core(fn, next, gates),
  };
}

/**
 * `core` builds a remote function straight from a core one — the schema and the call both
 * come from there. The other three take a schema and a handler like `$app/server`'s own,
 * and apply `auth()` plus the `VisibleError` guard so no call site repeats them. Which one
 * you reach for decides the guard's mode, so it is never passed by hand.
 */
export const remote = {
  core: <Schema extends z.ZodType, Result>(
    fn: ((input: z.infer<Schema>) => Result) & { schema: Schema },
  ) => core(fn, fn.schema as z.ZodType<z.infer<Schema>, z.input<Schema>>),

  query: <Parsed, Raw, Result>(
    schema: z.ZodType<Parsed, Raw>,
    handler: (input: Parsed) => Result | Promise<Result>,
  ) =>
    query(schema, async (input: Parsed) => {
      auth();
      return guard(async () => handler(input), "throw");
    }),

  form: <Parsed, Raw extends RemoteFormInput, Result>(
    schema: z.ZodType<Parsed, Raw>,
    handler: (input: Parsed) => Result | Promise<Result>,
  ) =>
    build(schema, async (input: Parsed) => {
      auth();
      return guard(async () => handler(input), "form");
    }),

  command: <Parsed, Raw, Result>(
    schema: z.ZodType<Parsed, Raw>,
    handler: (input: Parsed) => Result | Promise<Result>,
  ) =>
    command(schema, async (input: Parsed) => {
      auth();
      return guard(async () => handler(input), "throw");
    }),
};
