# Performance

**Lens:** where does the user wait, and where does the system do work nobody needed? This covers
the browser, the server and the dev loop.

## Questions to ask of every area

- What happens on first load, on navigation, on each common click? How much of that is needed for
  what's on screen?
- What gets mounted, fetched, computed or serialized before anyone asks for it?
- What is fetched twice, fetched whole when a slice would do, or fetched in a waterfall that could
  run in parallel?
- What scales with list length (rows, cards, options) that shouldn't?
- What does the server do per request that could be done once, in SQL, or not at all?
- What slows the dev loop: startup, cold compile, HMR, the test runtime?

## Sweeps (rotate them between rounds)

1. **Flow measurement:** drive the real flows in a browser, record main-thread time per action
   (CDP `Performance.getMetrics`), long tasks, and DOM size. Rank the results by cost.
2. **Network:** count and size requests per route on hard load, on client navigation and on
   mutation. Look for duplicates, oversized payloads and serial chains.
3. **Server:** time SSR per route against the time of its data calls, and inspect the query plans
   of the slowest core ops.
4. **Static scan:** look for per-item widgets in loops, eager imports of heavy modules, formatters
   or regexes built per call, effects that refetch on every change, and missing `enabled`/lazy
   gates.
5. **Bundle and compile:** module count per route, the slowest transforms, barrel imports, client
   deps that could load lazily.
6. **Startup:** time each step from `bun dev` to the first rendered page.

## Evidence

- A number before and a number after, from the same harness on the same data, as a median.
- For anything layout-related, A/B it against the original: console warnings like forced-reflow or
  slow-handler are symptoms, not proof.

## Fix principles

- **Do less before doing it faster:** skip it, defer it until first use, or move it to the
  server or into SQL.
- **Fix in the shared layer:** the primitive, the query helper, the core op. That fixes every
  caller at once.
- **No behaviour change:** keyboard access, focus and data freshness stay the same.

## Done for a round

Every candidate is either confirmed with numbers and fixed, or recorded as no-gain or deferred.
