# Correctness

**Lens:** where does the system do the wrong thing, lose or leak data, or fail badly? This covers
the API, MCP, core, queue and dashboard.

## Questions to ask of every area

- **Permissions:** does every operation check who is calling, and can a member reach admin data or
  another user's data through any surface (dashboard, API, MCP, CLI)?
- **Input:** what happens with empty values, very long ones, unicode, duplicates, concurrent edits,
  stale tabs, and IDs that don't exist?
- **Failure:** what happens when the network, the database, the queue or a third party fails
  halfway? Is the user told, is the state left consistent, and does a retry help or hurt?
- **Freshness:** after a mutation, does every view showing that data update, or show a stale value?
- **Time:** are dates, time zones, all-day versus timed values, and the days DST changes handled the
  same way everywhere?
- **Data:** can the schema and the code disagree (enums, nullability, cascades)? Can a migration
  lose data?
- **Contracts:** do the SDK, OpenAPI, MCP tool schemas and the core types agree? Do error shapes
  match what clients parse?

## Sweeps (rotate them between rounds)

1. **Permission matrix:** list every operation × role × surface, try each one, and compare against
   the intended matrix (the core sweep test is the source of truth).
2. **Fuzz the edges:** script the main mutations with boundary inputs, through the API and the UI.
3. **Fault injection:** kill the DB connection, delay or fail requests, drop the queue, then
   observe the UI and the stored state.
4. **Concurrency:** two sessions edit the same record; check for races, lost updates and ordering.
5. **Contract diff:** compare generated SDK and OpenAPI against the core types and the MCP schemas.
6. **Test gaps:** use `fallow health --coverage-gaps` and look for core ops with no test; write the
   missing tests (CI runs them).

## Evidence

A failing script, request or test before the fix and a passing one after. Security-relevant
findings get a test that pins the fix.

## Fix principles

- **Fix the cause where it lives,** usually core. A UI guard doesn't count as an authorization fix.
- **Fail loudly and recoverably:** clear errors, consistent state, and safe retries.
- **Add a regression test for every confirmed bug.** Mint and seed inline, with no mocks.

## Done for a round

Every sweep ran against every area. Each confirmed bug has a fix, a test and a PR, or a deferral
with a reason.
