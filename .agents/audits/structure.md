# Structure

**Lens:** where is the code harder to read, change or extend than it needs to be? This covers
organization, naming, duplication, coupling and documentation: the developer experience of the repo
itself.

## Questions to ask of every area

- Does each module have one clear job? Do its file and export names say what it is?
- Is the same idea implemented twice: two helpers, two components, two schemas for one shape?
- Do slices and layers depend in the allowed direction? Check slice→slice imports, UI reaching into
  core internals, and data plumbed through context instead of fetched at the leaf.
- Is there dead code: unused exports and files, branches for removed features, compat shims for a
  past that's gone?
- Are there speculative layers: registries, options or abstractions with one caller?
- Do the docs, AGENTS.md files and comments describe the code as it is now? Are comments short and
  about the non-obvious?
- Does the code follow the repo's style rules (`CLAUDE.md`)? Single-word names, no `any`, early
  returns, inference over annotations.
- Are complex functions and templates small enough to read? Are types precise where they're
  exported?

## Sweeps (rotate them between rounds)

1. **Gates:** fallow `dead-code`, `health`, `dupes` and `audit`, plus the typecheck, across the
   repo, not just the changed files.
2. **Dependency graph:** map imports between features, packages and layers, and flag edges that
   break the rules.
3. **Duplication:** find near-identical functions, components and schemas, and anything copied
   between apps.
4. **Doc drift:** for each doc and AGENTS.md claim, check it against the code: commands, paths,
   patterns, flags.
5. **Style pass:** review the most-changed files from the last N commits against the style guide.
6. **Change simulation:** pick a plausible next feature, trace what would have to change, and flag
   anything that makes it harder than it should be.

## Evidence

The gate output, the import edge, both duplicate sites, or the doc line next to the code that
contradicts it. A fix leaves the gates clean, with behaviour and types unchanged.

## Fix principles

- **Delete before abstracting.** Merge duplicates into the existing shared place, rather than a new
  layer.
- **Smallest API that serves the callers we have.** No speculative options.
- **No backwards-compat shims or redirects.** The app isn't in production.
- **Docs change in the same PR as the code they describe.**

## Done for a round

All gates are clean repo-wide. Every flagged edge, duplicate and drift is fixed or recorded with a
reason.
