import { command, form, query } from "$app/server";
import { error, invalid } from "@sveltejs/kit";
import type { RemoteForm, RemoteFormInput } from "@sveltejs/kit";
import type { z } from "zod";
import { Actor } from "@template/core/actor";
import { VisibleError } from "@template/core/error";
import type { Permission } from "@template/core/permission";

// 401, not 403: no session at all is fixable by signing in, where a `forbidden` from
// `Actor.check` is not. The client branches on the difference.
function auth() {
  if (Actor.use().type !== "user") error(401, "Authentication required");
}

/** How a `VisibleError` gets out: as a form issue, or as a status the error page owns. */
type Mode = "form" | "throw";

/** Denials the error page owns rather than the form: nothing in the fields can fix them. */
const fatal = new Set<VisibleError["type"]>([
  "forbidden",
  "authentication",
  "rate_limit",
  "internal",
]);

async function guard<T>(fn: () => Promise<T>, mode: Mode): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    // Redirects, `error()` and `invalid()` are SvelteKit's own control flow, and a real bug
    // belongs in `handleError` with its stack. Only a `VisibleError` is ours to convert.
    if (!(err instanceof VisibleError)) throw err;
    if (mode === "form" && !fatal.has(err.type)) invalid(err.message);
    error(err.statusCode(), { message: err.message, code: err.code });
  }
}

type Gate = () => void | Promise<void>;

const wrap =
  <I, R>(gates: Gate[], fn: (input: I) => R, mode: Mode) =>
  (input: I) =>
    guard(async () => {
      for (const gate of gates) await gate();
      return fn(input);
    }, mode);

// `form` types its schema through a conditional that only resolves once the schema is
// concrete, so a generic one never gets past it. The delegation is bridged here; the
// signature is the real contract.
const build = form as <Parsed, Raw extends RemoteFormInput, Result>(
  schema: z.ZodType<Parsed, Raw>,
  run: (input: Parsed) => Promise<Result>,
) => RemoteForm<Raw, Result>;

function chain<Parsed, Raw, Result>(
  gates: Gate[],
  fn: ((input: Parsed) => Result) & { schema: unknown; force: (input: Parsed) => Result },
  schema: z.ZodType<Parsed, Raw>,
) {
  // SvelteKit validates against `schema` before the handler runs, so when it is core's own
  // the second parse is redundant. `.with` swaps in a different one, and there core's parse
  // still earns its keep by stripping keys the hand-written schema let through.
  const call = schema === fn.schema ? fn.force : fn;
  return {
    query: () => query(schema, wrap(gates, call, "throw")),
    command: () => command(schema, wrap(gates, call, "throw")),
    with: <Next>(next: z.ZodType<Parsed, Next>) => chain(gates, fn, next),
  };
}

function terminals(gates: Gate[]) {
  return {
    /**
     * Straight from a core function — the schema and the call both come from there. A core
     * schema is often not form-shaped (`void`, a bare id), and a form spells its own schema
     * out anyway, so writes behind a form go through `form` below instead.
     */
    core: <Schema extends z.ZodType, Result>(
      fn: ((input: z.infer<Schema>) => Result) & {
        schema: Schema;
        force: (input: z.infer<Schema>) => Result;
      },
    ) => chain(gates, fn, fn.schema as z.ZodType<z.infer<Schema>, z.input<Schema>>),

    query: <Parsed, Raw, Result>(
      schema: z.ZodType<Parsed, Raw>,
      handler: (input: Parsed) => Result | Promise<Result>,
    ) => query(schema, wrap(gates, handler, "throw")),

    form: <Parsed, Raw extends RemoteFormInput, Result>(
      schema: z.ZodType<Parsed, Raw>,
      handler: (input: Parsed) => Result | Promise<Result>,
    ) => build(schema, wrap(gates, handler, "form")),

    command: <Parsed, Raw, Result>(
      schema: z.ZodType<Parsed, Raw>,
      handler: (input: Parsed) => Result | Promise<Result>,
    ) => command(schema, wrap(gates, handler, "throw")),
  };
}

type Remote = ReturnType<typeof terminals> & {
  readonly public: Remote;
  use(gate: Gate): Remote;
  can(grants: Permission.Grants): Remote;
};

/**
 * Every entry point carries the same gate chain, so `auth()` and the `VisibleError` guard are
 * never repeated at a call site. Gates come first and the terminal last — which terminal you
 * reach for decides the guard's mode, so it is never passed by hand.
 *
 * `can` is a role-level gate: `Actor.check` resolves `:own` grants only when handed the row's
 * owner, which a static chain cannot know, so ownership-scoped checks stay inside core.
 */
function make(gates: Gate[]): Remote {
  let bare: Remote | undefined;
  return {
    ...terminals(gates),
    // Lazy: a plain property would recurse forever building the chain.
    get public() {
      return (bare ??= make(gates.filter((gate) => gate !== auth)));
    },
    use: (gate) => make([...gates, gate]),
    can: (grants) => make([...gates, () => Actor.check(grants)]),
  };
}

export const remote = make([auth]);
