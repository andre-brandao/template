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
    handler/            — one file per domain (app, file, hook, key, project, todo, user, webhook)
    target/             — bun.ts | lambda.ts | worker.ts, the entry points
  auth/ mcp/ queue/     — same shape: the service, plus its target/
```

Each service is a plain Hono app; its `target/` wraps it with a database connection for the
environment it runs in, so the app itself never knows where it runs. See `docs/runtime.md`.

## Key Patterns

**Identity** — every handler runs under the identity `middleware.ts` resolved: `public`, `user`,
`agent` (software acting for a user, narrowed to a scope), `system` (only an App's account: a
`kind: "system"` row, capped by its owner) or `internal` (the app's own code, like `auth`, holding
exactly its `scope`). There is no root: seeds and test setup run as `internal` holding `Permission.all`.

```ts
import { Identity } from "@template/core/identity";

Identity.use(); // the current identity ({ type, properties })
Identity.userID(); // who answers for the act — the user, the agent's user, or the App
Identity.check({ todo: ["read"] }); // 403 unless held (an agent also needs it in scope)
```

Handlers never call `provide` — the middleware does, with whatever `Auth.resolve` returned. To act
as software, use `Identity.delegate(name, grants?, cb)` (for the caller, narrowed) or
`Identity.internal(name, grants, cb)` (the app itself, e.g. `auth` signing someone up). An App or
`public` can't delegate; `internal` only narrows to another `internal`.

**Auth** — a request carries `Authorization: Bearer <token>`, and `Auth.resolve` (core) owns every
format: `agt-` is a delegation (the copilot → `agent`), `sk-` an API key (`user`, or `system` for an App), anything
else a JWT from the OpenAuth issuer, verified through the `Auth.Issuer` port and linked to a local
user. A JWT minted for an `mcp:*` client is an `agent` and only works on the MCP. The role always
comes from the user row. Dashboard sessions are cookies only — never a bearer. No header means
`public`.

**Issuer** — `auth/` only says who someone is (`identity` subject: `provider:id` + email) and never
touches an app's database, so one issuer (`id.developing.company`) can serve every app. It adds
dynamic client registration and PKCE metadata for MCP clients; `AUTH_REDIRECTS` lists extra
allowed redirect origins.

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
  doc(Todo.fromID.meta, {
    200: doc.json(Todo.Info),
    ...doc.errors(400, 401, 403, 404, 500),
  }),
  authRequired,
  validator("param", id),
  async (c) => c.json(found("Todo", await Todo.fromID(c.req.valid("param").id)), 200),
)
```

`doc()` takes the op's docs and the route's own responses — so summary, description, 200
description and example all come from schemas that already exist. `doc.json` wraps one,
`doc.page` a page of them, `doc.list` an array, `doc.ok` a bare `"ok"`, `doc.error` one of the
standard error bodies and `doc.errors` several of them, spread in. The same `meta` feeds the
MCP tool over that op, so the two can never drift.

Nothing is merged in: a route lists every status it can return, and only those. `authRequired`
means 401, a `validator` means 400, a reachable `Identity.check` means 403, a reachable `found()`
means 404, and 500 is on every route via `onError`. The API tests read the spec back and drive
each declared status, so an error documented on a route that cannot produce it fails the suite.

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
