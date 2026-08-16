# Multi-tenant workspaces

A plan for turning the template's single shared tenancy into opencode-style workspaces.

## 1. Where we are today

The template is **single-tenant**. There is one implicit organisation: every user sees every
project, every todo, every event.

| Piece                                 | Today                                                               |
| ------------------------------------- | ------------------------------------------------------------------- |
| `Actor.Info` (`core/src/actor.ts`)    | `public` \| `system` \| `user{userID, role}` — no tenant dimension  |
| `Permission.Roles`                    | `admin` / `member`, held globally on `user.role`                    |
| `user`                                | Global identity: email, providers, prefs, role                      |
| `project`, `todo`, `event`, `webhook` | No owner column beyond `created_by` — a shared pool                 |
| `key`                                 | `user_id` + `type` (`api` \| `signing`); resolves to a bare user id |
| `job` (queue)                         | Carries `user_id` so `jobs.run` can rehydrate the actor             |
| Dashboard session                     | Signed cookie `{ userID, email }` (`lib/server/session.ts`)         |
| API auth (`api/middleware.ts`)        | `sk-` key → `Key.verify` → userID; JWT → OpenAuth subject → userID  |
| Storage                               | Flat keys, no tenant prefix                                         |

Every read is `Database.use(tx => tx.select().from(T).where(...))` with no scoping predicate —
about 50 query sites across 10 core modules.

## 2. How opencode does it

From `sst/opencode`, `packages/console/core`:

- **`account`** — the global identity. Owns nothing; `auth(provider, subject) → account_id`
  is the login table.
- **`workspace`** — the tenant. `id`, `slug` (unique), `name`, plus flags.
- **`user`** — a _membership_ row, not a person: `(workspace_id, id)` composite PK,
  `account_id` (nullable), `email` (nullable), `role`. One human with two workspaces has one
  account and two user rows.
- **Every tenant table** spreads `workspaceColumns` (`id` + `workspace_id`) and
  `workspaceIndexes(table)` → `primaryKey(workspace_id, id)`. Ids are only unique _within_ a
  workspace.
- **Actor** is `public | account{accountID,email} | user{userID, workspaceID, accountID, role} |
system{workspaceID}`, with `Actor.workspace()` throwing for actors that have no tenant.
- **Scoping is manual**: literally every query carries `eq(T.workspaceID, Actor.workspace())`.
- **Invites** insert a user row with `email` set and `account_id` null; on login
  `User.joinInvitedWorkspaces` claims every row matching the account's email and mints a key.
- **Session** holds a map of accounts plus `current`; the _workspace_ comes from the URL
  (`/workspace/[id]`), and `getActor(workspace)` looks up the membership row per request.
- **API keys are workspace-scoped** — the key row is what tells the gateway which tenant a
  request is for.

## 3. Target model for this repo

Keep the template's `user` table as the **global account** and add a membership table. This is
the same shape as opencode with different names, and it avoids rewriting the id space.

```
user        (global)  id, email, name, image, prefs, providers…   ← the person
workspace   (global)  id, slug, name, image
member      (tenant)  workspace_id, id, user_id?, email?, role    ← the membership
project/todo/key/webhook/event/job (tenant)  workspace_id, id, …
```

### Why not rename `user` → `account` and make `user` the membership row (opencode-faithful)?

Because `created_by`, `assignee`, `event.user_id`, `key.user_id`, `provider.user_id`, the
session cookie, the OpenAuth subject, the SDK and the CLI all currently mean _global user id_.
Turning that into a per-workspace membership id is a rewrite of every one of those surfaces for
a benefit this template does not need yet (per-workspace display name, colour, spend limit).

**Recommendation:** membership table, global `user` unchanged. If per-workspace user attributes
are wanted later they go on `member` without another migration of the id space.

### Roles split in two

`user.role` today powers both the workspace permissions _and_ the platform back office
(`Admin.users`, `Admin.tables`). Those separate:

- `member.role` — `admin` \| `member`, per workspace. Drives `Permission.Roles`.
- `user.staff` (boolean) — platform back office only. `Permission.Statement.admin` is gated on
  it, not on a workspace role. Guards against a workspace admin reaching the platform console.

### Tenant vs global tables

| Tenant-scoped                         | Global                          |
| ------------------------------------- | ------------------------------- |
| `project`, `todo`, `webhook`, `event` | `user`, `provider`, `workspace` |
| `key` where `type = 'api'`            | `key` where `type = 'signing'`  |
| `job` (via a `workspace_id` column)   | —                               |
| `member`                              | —                               |

`key.workspace_id` is nullable precisely so the signing key stays global.

## 4. Enforcement

opencode hand-writes `eq(T.workspaceID, Actor.workspace())` everywhere. That works but one
forgotten predicate is a cross-tenant leak, and unlike MySQL/PlanetScale we are on Postgres and
can back it with the database. Three layers, cheapest first:

1. **A predicate helper**, used at every tenant query site:

   ```ts
   // core/src/drizzle/tenant.ts
   export const tenant = <T extends { workspaceID: PgColumn }>(table: T) =>
     eq(table.workspaceID, Actor.workspace());
   ```

   One import, one call, and `Actor.workspace()` throws for an actor with no tenant — so a
   forgotten `Actor.provide` fails loudly instead of reading everything.

2. **Composite primary keys** `(workspace_id, id)`. A `where id = ?` that forgets the tenant
   still returns another workspace's row, so this is not enforcement on its own — but it makes
   the intent structural and matches opencode.

3. **Row-level security (phase 5, optional).** `Database.transaction` issues
   `SELECT set_config('app.workspace', $1, true)` and each tenant table gets
   `USING (workspace_id = current_setting('app.workspace', true))`. Because it is `true`
   (transaction-local) it is pool-safe. This is the one place we can do better than opencode.
   Caveat: `Database.use` does not always open a transaction, so RLS requires routing tenant
   reads through one — treat as a hardening pass, not a prerequisite.

Plus **an isolation test** (see §7) that fails the build on a missing predicate.

## 5. Actor and auth surfaces

### Actor

```ts
interface Account {
  type: "account";
  properties: { userID: string };
}
interface User {
  type: "user";
  properties: { userID: string; workspaceID: string; role: Permission.Role };
}
interface System {
  type: "system";
  properties: { workspaceID?: string };
}
interface Public {
  type: "public";
  properties: {};
}
```

`Actor.workspace()` returns `properties.workspaceID` or throws. `account` is the new
in-between state: signed in, no workspace picked — it is what the workspace list, the create
form and the accept-invite flow run as.

### Dashboard (`apps/dashboard`)

**The constraint that shapes this:** SvelteKit remote functions (`$app/server`) POST to
`/_app/remote/<hash>`, not to the page URL. `event.params` in `hooks.server.ts` therefore does
**not** carry a `/w/[slug]` route param for a remote call. A URL-only workspace, opencode-style,
would leave every `.remote.ts` call unscoped.

**Recommendation:** the **session cookie is authoritative** for the current workspace; the URL
carries the slug for deep links and display.

- `Session` becomes `{ userID, email, workspaceID }` — already signed, so it is tamper-proof,
  but `handleAuth` still verifies the membership row on every request (a stale cookie after a
  removal must not authorise).
- `handleAuth` resolves: session → user → `Member.fromWorkspace(session.workspaceID)`; on a hit
  provide `user{userID, workspaceID, role}`, on a miss provide `account`.
- `/w/[slug]/+layout.server.ts` reconciles: if the slug's workspace ≠ the cookie's, verify
  membership, rewrite the cookie and `redirect(303, url)` so the following request (and all its
  remote calls) is scoped correctly. One extra round-trip on switch only.
- `/` as `account` → redirect to the last workspace, or the picker, or onboarding.
- A `switchWorkspace` command writes the cookie; the switcher lives in the sidebar.

### API (`packages/functions/src/api`)

- `Key.verify` returns `{ userID, workspaceID }` instead of a bare userID; an `sk-` key
  authenticates straight into its workspace, exactly like opencode's gateway.
- A JWT resolves to an `account`. Workspace selection via `x-workspace-id` header, checked
  against membership; absent → `account` actor, and the handlers that need a tenant 400 through
  `Actor.workspace()`'s throw. Add `GET /workspace` so a client can discover its options.
- MCP inherits this — it already mounts the same `auth` middleware.

### Queue

`port.Job` and the `job` table gain `workspaceID: string | null` beside the existing `userID`.
`Queue.push` captures it from the actor; `jobs.run` provides `user{userID, workspaceID, role}`
by reading the member row (role must come from `member`, not `user`, or a demoted admin keeps
their grants through a queued job).

### Storage

Object keys get a `w/<workspaceID>/` prefix, applied in `Storage.disk()`'s wrapper rather than
at each call site. The signed-URL routes (`avatars/[kind]/[id]`, `files/[name]`) must include
the workspace in the signed payload so a signature cannot be replayed across tenants.

### Onboarding and invites

- First login with no membership → `Workspace.create({ name })` in the same transaction as the
  member row (`role: "admin"`), mirroring opencode's create-workspace-plus-default-key.
- `Member.invite({ email, role })` inserts `member` with `email` set, `user_id` null.
- On every login, `Member.claim(email)` fills `user_id` on matching pending rows — opencode's
  `joinInvitedWorkspaces`.
- Unique indexes: `(workspace_id, user_id)` and `(workspace_id, email)`.

## 6. Migration

One migration, ordered so it is safe on a populated database:

1. Create `workspace` and `member`.
2. Insert a single workspace (`name: 'Default'`, slug `default`).
3. Add nullable `workspace_id` to `project`, `todo`, `key`, `webhook`, `event`, `job`.
4. Backfill all of them with the default workspace id (`key` only where `type = 'api'`).
5. Insert a `member` row per live `user`, carrying `user.role` across.
6. `SET NOT NULL` on the tenant columns (`key` stays nullable), swap primary keys to
   `(workspace_id, id)`, add `member` unique indexes, add `user.staff`.
7. Keep `user.role` for one release, then drop it in a follow-up — a same-migration drop makes
   rollback lossy.

Generated with `bun run db:generate` from `packages/core` (**manual step — agents must not run
it**), with the backfill hand-written into the generated SQL.

## 7. Tests

- `packages/core/test/util.ts` grows `withTestWorkspace(name, cb)` and
  `withTestUser(name, cb, { role, workspaceID })`; the existing helper creates a workspace
  implicitly so the current tests keep passing.
- **`tenant.test.ts`** — the one that matters: two workspaces, seed a row of every tenant type
  in A, then assert from B that each namespace's `list` returns nothing and `fromID` returns
  null. Table-driven over the tenant module list, so a new feature is one line.
- `key.test.ts`: a key from A cannot read B.
- Queue: a job pushed in A runs with A's workspace.

## 8. Phases

| Phase | Scope                                                                                             | Ships                        |
| ----- | ------------------------------------------------------------------------------------------------- | ---------------------------- |
| 1     | `workspace.sql.ts`, `member.sql.ts`, `workspaceColumns`/`workspaceIndexes`, `tenant()`, migration | Schema, nothing reads it yet |
| 2     | `Actor` union + `Actor.workspace()`, `Permission` (`workspace`/`member` resources, `staff`)       | Core compiles, tests updated |
| 3     | Scope every core query; `Workspace`/`Member` namespaces; queue + storage prefixes                 | Backend is multi-tenant      |
| 4     | Dashboard: session, `handleAuth`, `/w/[slug]`, switcher, members page, invites, onboarding        | Usable end to end            |
| 5     | API `x-workspace-id` + workspace-scoped keys, MCP, CLI, SDK regen, `scripts/feature.ts` templates | External surfaces            |
| 6     | Hardening: RLS, isolation tests, `Admin` back office scoped to `staff`, seed script               | Defence in depth             |

Phases 1–3 are one reviewable unit (the schema is useless alone, and phase 3 is where the
isolation test earns its keep). Phase 4 is the biggest single chunk of work.

## 9. Files touched

| File                                                  | Change                                                           |
| ----------------------------------------------------- | ---------------------------------------------------------------- |
| `core/src/drizzle/types.ts`                           | `workspaceColumns`, `workspaceIndexes`                           |
| `core/src/drizzle/tenant.ts` _(new)_                  | `tenant(table)` predicate                                        |
| `core/src/workspace/{index,workspace.sql}.ts` _(new)_ | Workspace CRUD, slug, create-with-owner                          |
| `core/src/workspace/{member,member.sql}.ts` _(new)_   | Membership, invite, claim, role changes                          |
| `core/src/actor.ts`                                   | `account` actor, `workspaceID`, `Actor.workspace()`              |
| `core/src/permission.ts`                              | `workspace` + `member` resources; roles become workspace roles   |
| `core/src/identifier.ts`                              | `workspace: "wrk"`, `member: "mem"`                              |
| `core/src/{project,todo,platform/*}/…`                | `workspaceColumns` + `tenant()` at every query site              |
| `core/src/user/{index,auth}.ts`                       | `staff`, `Member.claim` on provision, `list` scoped to workspace |
| `core/src/lib/queue/*`, `core/src/jobs.ts`            | `workspaceID` on job + actor rehydration                         |
| `core/src/lib/storage/index.ts`                       | Tenant key prefix                                                |
| `core/src/admin/index.ts`                             | Gate on `staff`, keep global                                     |
| `functions/src/api/middleware.ts`                     | Key → workspace, `x-workspace-id`, account actor                 |
| `functions/src/api/handler/*`, `mcp/*`                | Workspace routes, unchanged handlers otherwise                   |
| `dashboard/src/hooks.server.ts`                       | Workspace resolution in `handleAuth`                             |
| `dashboard/src/lib/server/session.ts`, `app.d.ts`     | `workspaceID` in the session                                     |
| `dashboard/src/routes/(app)` → `/w/[slug]`            | Route move, layout reconcile, switcher                           |
| `dashboard/src/lib/features/workspace/*` _(new)_      | Picker, members, invites, settings                               |
| `scripts/{seed,feature}.ts`                           | Seed a workspace; scaffold tenant-scoped tables                  |
| `apps/cli`, `packages/sdk/ts`                         | Workspace flag/header; SDK regenerated (manual)                  |

## 10. Open questions

1. **Workspace slug in the URL, or the id?** opencode uses the id (`/workspace/[id]`) and keeps
   slug unique-but-optional. Slugs are nicer but need a rename story. Proposal: slug, with the
   id accepted as a fallback.
2. **Personal workspace on signup, or force a create step?** Auto-create keeps first-run
   identical to today; an explicit step is clearer for teams. Proposal: auto-create named after
   the user, renameable.
3. **Can one user belong to many workspaces from day one?** The schema allows it either way; the
   UI cost is the switcher and the `/` redirect. Proposal: yes — it is nearly free once the
   membership table exists, and retrofitting it is not.
4. **Does the platform back office survive?** `Admin.tables` is genuinely global. Proposal: keep
   it, gate on `user.staff`, move it off `/admin` to `/platform` so it does not collide with a
   workspace admin section.
