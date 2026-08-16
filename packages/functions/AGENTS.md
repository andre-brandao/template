# functions/

Hono services backed by `@template/core`: `api` (3000, OpenAPI-documented), `mcp` (3001),
`auth` (3002, OpenAuth issuer) and the `queue` worker. Transport only — no business logic here.

## Structure

```
src/
  target.ts             — one wrapper per environment (bun, lambda, worker)
  api/
    index.ts            — mounts all routers
    routes.ts           — route definitions
    common.ts           — validator/authRequired/PaginatedQuery/ErrorResponses helpers
    doc.ts              — describe(tag) → doc(), the OpenAPI shaping for a handler
    middleware.ts       — actor resolution (bearer token) + error → HTTP response
    handler/            — one file per domain (file, key, project, todo, user)
    target/             — bun.ts | lambda.ts | worker.ts, the entry points
  auth/ mcp/ queue/     — same shape: the service, plus its target/
```

Each service is a plain Hono app; its `target/` wraps it with a database connection for the
environment it runs in, so the app itself never knows where it runs. See `docs/runtime.md`.

## Key Patterns

**Actor** — every handler runs under an actor resolved by `middleware.ts`. Use the `Actor` namespace:

```ts
import { Actor } from "@template/core/actor";

Actor.use(); // get current actor ({ type, properties }) — falls back to "public"
Actor.userID(); // get the current user's id, throws if actor is "public"
Actor.assert("user"); // assert type and return typed actor
```

Middleware sets the actor via `Actor.provide(type, properties, next)` — handlers never call `provide` directly.

**Auth** — a request carries `Authorization: Bearer <token>`, and `middleware.ts` resolves it two
ways: an `sk-` prefix is a user-minted API key looked up in Postgres (`Key.verify`), anything else
is a JWT from the OpenAuth issuer, verified statelessly against its JWKS. Both collapse to a bare
user id, and the role always comes from the user row — so an API key can never outlive the
permissions of whoever minted it. No header at all means the `public` actor.

**Errors** — throw `VisibleError` for client-safe error responses:

```ts
import { VisibleError, ErrorCodes } from "@template/core/error";
throw new VisibleError("not_found", ErrorCodes.NotFound.RESOURCE_NOT_FOUND, "Resource not found");
```

**OpenAPI** — the spec starts in core. Its Zod schemas carry the `.meta({ description, example })`
annotations, and its `fn()` ops carry a `meta` of their own (`{ title, description }`) that names the
operation. A handler restates neither:

```ts
const doc = describe("Todo"); // binds the tag once for the file

.get(
  "/:id",
  doc(Todo.fromID.meta, { 200: doc.json(Todo.Info) }),
  authRequired,
  validator("param", id),
  async (c) => c.json(found("Todo", await Todo.fromID(c.req.valid("param").id)), 200),
)
```

`doc()` takes the op's docs and the route's own responses, and merges in the standard error set —
so summary, description, 200 description and example all come from schemas that already exist.
`doc.json` wraps one, `doc.page` a page of them, `doc.list` an array, `doc.ok` a bare `"ok"`.
The same `meta` feeds the MCP tool over that op, so the two can never drift.

Pass a literal `{ title, description }` instead when a route reshapes its input into something core
doesn't model — `/me` reads the actor rather than an id, and `POST /key` takes `expiresInDays`
where core takes a date. Every public route needs request and response schemas.

**Handlers** — keep handlers thin: validate input, call a `@template/core` function, return the result. No
business logic in handlers.

## Commands

```sh
bun run dev          # api, hot reload. also dev:mcp, dev:auth, dev:queue
bun run gen:spec     # regenerate packages/sdk/openapi.json — the user runs this, not an agent
bun typecheck        # type check
bun test             # run tests
```

Whenever a route or a core schema changes, the spec is stale and so is the SDK generated from it
(`packages/sdk/ts`). Hand the user `gen:spec` here, then `gen` there — in that order.
