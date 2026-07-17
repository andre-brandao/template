# Test Coverage Improvement Plan

Baseline (`fallow health --coverage-gaps`): **37.7% file coverage** — 58 / 154 runtime
files tested, 96 untested files, 92 untested exports.

Conventions to follow (match the existing suite):

- `bun:test` (`describe` / `it` / `expect`); run from the package dir, never the repo root.
- Core DB-backed logic uses the `withTestUser` helper in `packages/core/test/util.ts`
  (real Drizzle, no mocks). Reuse it — do not mock the database.
- Pure functions get plain unit tests, no fixtures.
- Run `bun typecheck` from the package dir and
  `fallow audit --format json --quiet --explain --gate-marker agent` before each commit.

---

## P0 — Security-critical + pure logic (quick wins, no DB)

### `packages/core/src/util/password.ts` → `packages/core/test/password.test.ts`
Auth-critical PBKDF2 with a constant-time compare and self-describing stored format.

- [ ] `hash` then `verify` round-trips for the same password → `true`.
- [ ] `verify` with the wrong password → `false`.
- [ ] `hash` output shape is `pbkdf2$sha256$<iter>$<salt>$<hash>` (5 `$`-parts).
- [ ] Two hashes of the same password differ (random salt).
- [ ] `verify` returns `false` for every malformed `stored` branch:
      wrong part count, non-`pbkdf2` prefix, non-`sha256` algo, non-integer iter, iter < 1.

### `packages/core/src/util/date.ts` → `packages/core/test/date.test.ts`
UTC week alignment + month-anchor math with day-clamping and month wrap.

- [ ] `getWeekBounds`: Monday-aligned start, 7-day span, `00:00:00.000` start;
      check a mid-week date and a Sunday (the `(getUTCDay()+6)%7` edge).
- [ ] `getMonthlyBounds`: anchor day clamps into short months
      (subscribed on the 31st → Feb anchors on 28/29).
- [ ] `getMonthlyBounds`: `start <= now < end`, and year rollover across Dec→Jan.
- [ ] `getMonthlyBounds`: when the current-month anchor is still in the future,
      it steps back a month (the `start > now` branch).

### `packages/core/src/util/memo.ts` → `packages/core/test/memo.test.ts`
- [ ] `fn` runs once; second call returns cached value; `loaded()` flips true.
- [ ] `reset()` clears value, calls `cleanup` when a value was loaded, sets `loaded()` false.
- [ ] `reset()` skips `cleanup` when nothing was loaded.

### `packages/core/src/util/fn.ts` → `packages/core/test/fn.test.ts`
- [ ] Call path runs `schema.parse` (throws on bad input).
- [ ] `.force()` bypasses validation; `.schema` is the passed schema.

---

## P1 — Complex core logic with partial / no coverage

### `Insights.calendar` + week/month paths of `Insights.activity`
Extend `packages/core/test/insights.test.ts` (uses `withTestUser`).

- [ ] `calendar` buckets creations by day and totals correctly (currently untested).
- [ ] `activity` with a range 32–217 days wide → **week** bucketing aligns to Monday.
- [ ] `activity` with a range > 217 days → **month** bucketing aligns to the 1st.
- [ ] `activity.series` length matches `buckets()` for each unit;
      `active` is false for an empty range.

### `packages/functions/src/api/middleware.ts` `auth`
Add branch coverage under `packages/functions/test/api/` (see `util.ts` `setupApiTest`).

- [ ] Malformed `Authorization` header (not `Bearer <token>`) → `UNAUTHORIZED`.
- [ ] Valid format but invalid/expired token → `INVALID_TOKEN`.
- [ ] No header → request proceeds as the `public` actor.

---

## P2 — `apps/dashboard` (largely uncovered)

Start with framework-independent pure logic; components/remote fns are a follow-up.

### `src/lib/utils/params.ts` `query()` → `apps/dashboard/test/params.test.ts`
- [ ] `getAll` → `get` → `.default()` fallback resolution per field.
- [ ] Invalid value collapses to the default.
- [ ] `update()` merges keys; empty string / empty array deletes the key.
- [ ] `update` is non-enumerable (spread yields pure data).

### `src/lib/server/guard.ts` → `apps/dashboard/test/guard.test.ts`
- [ ] `VisibleError` thrown inside → maps to `invalid()`.
- [ ] Any other error → `error(500)`.
- [ ] Success passes the value through.

### `src/lib/utils/debounce.ts` → `apps/dashboard/test/debounce.test.ts`
- [ ] Rapid calls fire once after `delay`; only the last args are used.

### `src/lib/features/todos/status.ts` → `apps/dashboard/test/status.test.ts`
- [ ] `label` turns `in_progress` → `In progress` (underscore → title case).
- [ ] `color` returns the mapped var, falls back to `var(--accent)` for unknown status.

### Follow-up (larger effort)
- [ ] Remote functions: `auth`, `todos`, `keys`, `insights` `*.remote.ts`.
- [ ] Dashboard components (mirror the `packages/ui` component tests).

---

## P3 — CLI and SDK

### `apps/cli/src/config.ts` → extend `apps/cli/test/`
- [ ] `token()` precedence: flag › `TEMPLATE_TOKEN` › saved config.
- [ ] `url()` precedence: flag › `API_URL` › saved config › `http://localhost:3000`.
- [ ] `read` returns `{}` when the file is absent; `write` then `read` round-trips; `clear` removes it.

### `packages/sdk/ts/fetch.ts` `createFetchWithRetry` → `packages/sdk/ts/test/`
- [ ] Retries once on a thrown network error (inject a fake fetch), succeeds on retry.
- [ ] Does **not** retry on a 4xx/5xx response.
- [ ] Aborts on timeout.

---

## Metric hygiene (not test work)

Exclude non-unit-testable surface from the coverage denominator so the number reflects
real, testable code:

- `packages/sdk/ts/**/*.gen.ts` (generated OpenAPI client)
- `infra/**`, `sst.config.ts` (IaC)
- `*.svelte` route entry points (`+page.svelte`, `+layout.svelte`)

Use `// fallow-ignore-file coverage-gaps` or the equivalent `fallow.toml` config.

---

## Suggested sequencing

1. **P0** — `password`, `date`, `memo`, `fn` (pure, hours not days).
2. **P1** — insights calendar/week/month + auth-middleware branches.
3. **P2** — dashboard `params` / `guard` / `debounce` / `status`.
4. **P3** — CLI config + SDK fetch.
5. Metric hygiene pass.
