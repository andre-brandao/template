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

| Path         | What                                                                            |
| ------------ | ------------------------------------------------------------------------------- |
| `src/`       | Generated flat-params `TemplateSdk` class, for the CLI and servers.             |
| `src/query/` | Generated grouped-params SDK plus `@tanstack/svelte-query` options (dashboard). |
| `build.ts`   | Generation script (`@hey-api/openapi-ts`).                                      |

Everything under `src/` is rewritten on every `gen`, `index.ts` files included. Hand-written
code goes in a sibling file outside `src/` with its own `exports` entry.

## Usage

```ts
import { createClient } from "@template/sdk/client";
import { TemplateSdk } from "@template/sdk";

const sdk = new TemplateSdk({ client: createClient({ baseUrl: "http://localhost:3000" }) });
```

The dashboard imports `@template/sdk/query` (`getXOptions`, `postXMutation`) from its
`api/<slice>.query.ts` files.

`apps/cli` reflects `TemplateSdk.prototype`, so a new endpoint appears there automatically
once this package regenerates. Nothing needs listing by hand.
