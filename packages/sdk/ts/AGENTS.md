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

| Path           | What                                                     |
| -------------- | -------------------------------------------------------- |
| `src/index.ts` | Public surface. Re-exports the generated files.          |
| `src/*.gen.ts` | Generated: SDK class, types, client.                     |
| `build.ts`     | Generation script (`@hey-api/openapi-ts`).               |
| `fetch.ts`     | Hand-written fetch wrapper: timeout + one retry, opt-in. |

Hand-written additions go in a non-`.gen.ts` file and are re-exported from `src/index.ts`.
That is the only way to extend this package.

## Usage

```ts
import { createClient } from "@template/sdk";
const client = createClient({ baseUrl: "http://localhost:3000" });
```

`apps/cli` reflects `TemplateSdk.prototype`, so a new endpoint appears there automatically
once this package regenerates. Nothing needs listing by hand.
