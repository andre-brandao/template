# Audits

An audit is a **lens** (performance, experience, structure, correctness, platform), not a list of
known bugs. It runs in rounds, for as long as it keeps finding things. Each round sweeps the whole
codebase and the running app through that lens, proves what it finds, fixes it, and looks again.

| Audit | Asks |
|---|---|
| [performance](performance.md) | Where does the user wait, and where do we do work nobody needs? |
| [experience](experience.md) | Where is the product confusing, inconsistent, inaccessible, or awkward on a phone? |
| [structure](structure.md) | Where is the code harder to read, change, or extend than it should be? |
| [correctness](correctness.md) | Where does it do the wrong thing, lose data, or fail badly? |
| [platform](platform.md) | Where do the build, dependencies, targets, CI, or tooling hold us back? |

## The loop

```text
coordinator(audit, budget?)
  ledger ← .agents/audits/.ledger/<audit>.md        (local, gitignored; survives sessions)
  loop:
    1 partition   split the repo into areas (see "Areas"); skip areas the user excluded
    2 sweep       one subagent per area, in parallel: find candidates through the lens
    3 dedup       drop anything already in the ledger (fixed, rejected, or deferred)
    4 prove       one subagent per candidate: reproduce or measure it, then confirm or reject
    5 fix         group the confirmed findings by area; one subagent and one PR per group
    6 verify      re-measure or re-run the repro; run the gates; watch CI; fix red checks
    7 record      write every finding to the ledger with its outcome and PR
    stop when:    two rounds in a row confirm nothing new, the budget runs out, or the user stops it
```

**Picking up again:** read the ledger first. Never re-report a finding the ledger already holds.
Deferred findings come back only when the user asks for them.

**Rounds get deeper:** a quiet round leads to a different sweep method next time (see each
audit's "Sweeps"), not the same one again. Before declaring dry, ask "what modality haven't I run?"
and run it.

## Areas (the default partition)

Split by where the code lives, not by issue type, so parallel fixes never touch the same files:

- **apps/dashboard:** one area per `src/lib/features/<feature>`, plus `src/routes` (layouts and
  shell), plus `src/lib` (shared lib and components)
- **packages/ui:** one area per primitive family (input, overlay, list/table, date, feedback,
  layout)
- **packages/core:** one area per domain module
- **packages/functions:** api, mcp, auth and queue
- **apps/cli, scripts, infra:** one area each

A fix that needs another area's files writes "needs: <file>" in its PR, and the coordinator handles
it after the merge.

## Evidence standard

- **Nothing ships on a hunch.** Every finding carries one of: a reproduction (steps or a script), a
  measurement (before and after, same harness, median of several runs), or a type, lint or gate
  failure.
- **A fix that doesn't change the evidence is reverted,** and the finding is recorded as
  "no-gain".
- **Design calls** (taste, product direction, anything the user decides) aren't fixed. Build them
  as a proposal (a draft PR, one commit per option) or ask, and record them as "proposed".

## Shared rules

- **Setup:** use a worktree from the latest `origin/dev`. Run bun via
  `bash -c 'source .direnv/flake-profile-*.rc; …'` and do `bun install` in the worktree.
- **Gates:** these are the only checks agents run. CI runs the tests.

  ```sh
  (cd apps/dashboard && bun run typecheck); (cd packages/ui && bun run typecheck)
  bun run fmt
  node_modules/.bin/fallow audit --format json --quiet --explain --gate-marker agent --base origin/dev
  node_modules/.bin/fallow health --format json --quiet      # no findings in touched files
  node_modules/.bin/fallow dead-code --format json --quiet   # duplicate_exports must be []
  ```

- **Running the stack:** each subagent gets its own port block and never uses the user's ports:
  `DB=pglite PGPORT=56N1 API_PORT=45N1 MCP_PORT=45N2 AUTH_PORT=45N3 WEB_PORT=55N1 bun dev`.
  - Stop it by port (`ss -ltnp "sport = :55N1"`).
  - Never use `pkill`, or a grep on the worktree path, which also matches your own shell.
- **Browser:** use system chromium (`which chromium`). Mint an admin or member session the way
  `.claude/skills/run-template/driver.ts` does.
- **Screenshots in PRs:** the repo is public, so use seed data only. Push the images to the orphan
  `pr-assets` branch from a temp clone, then embed them with raw URLs.
- **PRs:**
  - Into `dev`, one per area group.
  - The body has the evidence table: finding, proof, before, after.
  - Never merge, never force-push.
- **Never:** run `db:generate`, edit `.env`, deploy, or commit `docs/prototype/`.
