# sdk

Generated TypeScript client. **Never hand-edit `src/*.gen.ts` or `src/client/`, `src/core/`.**

## Where it comes from

```
functions/src/api/routes.ts  ──gen:spec──▶  packages/sdk/openapi.json  ──gen──▶  src/*.gen.ts
```

Both steps are **the user's to run**, in that order:

```sh
cd packages/functions && bun run gen:spec
cd ../sdk/ts && bun run gen
```

An agent that changed a route edits the route, then hands over the commands — it does not
run them and does not patch the generated output to match.

## Structure

| Path                                | What                                                               |
| ----------------------------------- | ------------------------------------------------------------------ |
| `src/sdk.gen.ts`                    | One function per operation, grouped params `{ path, query, body }` |
| `src/@tanstack/svelte-query.gen.ts` | `getXOptions`, `getXQueryKey`, `postXMutation` for the dashboard   |
| `src/index.ts`                      | Barrel of both, plus the types                                     |
| `build.ts`                          | Generation script (`@hey-api/openapi-ts`), one job                 |

Everything under `src/` is rewritten on every `gen`, `index.ts` files included. Hand-written
code goes in a sibling file outside `src/` with its own `exports` entry.

Infinite-query helpers are off: nothing pages by cursor, and the plugin mistook insights'
`start` for one.

## Usage

```ts
import { createClient } from "@template/sdk/client";
import { getTodoById } from "@template/sdk/sdk.gen";

const client = createClient({ baseUrl: "http://localhost:3000" });
const { data } = await getTodoById({ client, path: { id: "tod_123" } });
```

Without `client`, a call uses the shared one in `src/client.gen.ts`, which the dashboard
points at its `/api` proxy (`lib/query.ts`). Import `sdk.gen` rather than the barrel where
`@tanstack/svelte-query` isn't installed: the barrel re-exports the TanStack helpers, and the
peer is optional.

The dashboard imports `@template/sdk/query` (`getXOptions`, `postXMutation`) from its
`api/<slice>.query.ts` files. `./query` is an alias of the barrel, kept so those imports
didn't churn.

`apps/cli` reflects the functions exported by `sdk.gen`, so a new endpoint appears there
automatically once this package regenerates. Nothing needs listing by hand.
