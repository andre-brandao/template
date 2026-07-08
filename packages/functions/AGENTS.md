# functions/

HTTP API layer — Hono server (port 3000) exposing OpenAPI-documented endpoints backed by `@template/core`.

## Structure

```
src/
  index.ts              — entry point, starts the Hono server
  api/
    index.ts            — mounts all routers
    routes.ts           — route definitions
    common.ts           — Result/validator/authRequired/ErrorResponses helpers
    middleware.ts        — actor resolution (bearer session token) + error → HTTP response
    handler/             — one file per domain (auth, user, todo)
```

## Key Patterns

**Actor** — every handler runs under an actor resolved by `middleware.ts`. Use the `Actor` namespace:

```ts
import { Actor } from "@template/core/actor";

Actor.use(); // get current actor ({ type, properties }) — falls back to "public"
Actor.userID(); // get the current user's id, throws if actor is "public"
Actor.assert("user"); // assert type and return typed actor
```

Middleware sets the actor via `Actor.provide(type, properties, next)` — handlers never call `provide` directly.

**Auth** — a request carries `Authorization: Bearer <session token>`. The token is minted by
`POST /auth/register` or `POST /auth/login` (see `@template/core/user/auth`, the `Auth` namespace) and looked
up against the `session` table in `middleware.ts`. No OAuth, no API keys — just email/password and a session
token, on purpose, to keep this scaffold simple.

**Errors** — throw `VisibleError` for client-safe error responses:

```ts
import { VisibleError, ErrorCodes } from "@template/core/error";
throw new VisibleError("not_found", ErrorCodes.NotFound.RESOURCE_NOT_FOUND, "Resource not found");
```

**OpenAPI** — annotate routes with Zod schemas via `hono-openapi`'s `describeRoute`. Every public route must
have request/response schemas.

**Handlers** — keep handlers thin: validate input, call a `@template/core` function, return the result. No
business logic in handlers.

## Commands

```sh
bun run dev          # start dev server with hot reload
bun run gen:spec     # regenerate packages/sdk/openapi.json from routes
bun typecheck        # type check
bun test             # run tests
```

Regenerate the OpenAPI spec whenever routes or schemas change — the SDK (`packages/sdk/ts`) is generated from it.
