# Platform

**Lens:** where do the build, dependencies, runtime targets, CI and tooling hold the project back
or put it at risk?

## Questions to ask

- **Dependencies:** which are behind, deprecated, duplicated across packages, or unused? Does each
  major upgrade have a clear path, and do the peer ranges allow it?
- **Targets:** does every runtime target (each adapter, workers, docker, node and bun) still build,
  boot and serve? Does any target have no CI coverage?
- **Bundling:** does any dependency pull in runtime-only modules, Node built-ins, or something too
  heavy for the target it ships to?
- **CI:** is it fast, does it cover what matters, and does it fail for real reasons only? Do local
  gates match CI's?
- **Dev tooling:** are the scripts, generators, formatter and linter current and consistent, and
  documented where developers look?
- **Config drift:** do env vars, compiler flags, tsconfig and adapter config match across packages
  and docs?

## Sweeps (rotate them between rounds)

1. **Outdated and peers:** list outdated packages per workspace. For each major version, read the
   changelog and peer ranges and classify it: trivial, needs work, or blocked by.
2. **Build matrix:** build every target locally, and bundle each worker the way its deployer does.
3. **CI review:** collect durations and flaky jobs, and note any gap between local gates and CI.
4. **Unused and duplicated deps:** use `fallow dead-code` for dependencies, and look for the same
   library at several versions in the lockfile.
5. **Config audit:** diff env declarations, tsconfig and compiler flags against their use and the
   docs.

## Evidence

A build or CI log failing before and passing after, or a changelog/peer citation for a "blocked"
call.

## Fix principles

- **One major upgrade per PR,** with every breaking change it handled listed.
- **A blocked upgrade gets a report, not a workaround:** what blocks it, and the options (upgrade
  the blocker, drop the target, or wait).
- **Repo-wide reformats and renames go last.** Merge them with a merge commit and list them in
  `.git-blame-ignore-revs`.
- **Never deploy.** Name the deploy the user should run to confirm runtime behaviour.

## Done for a round

The matrix is green. Every outdated major is upgraded, scheduled, or documented as blocked.
