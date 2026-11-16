# Experience

**Lens:** where is the product confusing, inconsistent, inaccessible, or awkward? This covers
every screen, as an admin and as a member, in light and dark, on desktop and at 390 px.

## Questions to ask of every screen

- Can a first-time user tell what it is, what to do, and what just happened?
- Is every fact shown once, in the place you'd look for it, and editable where it's shown?
- Do the same things look and behave the same everywhere: pickers, menus, empty states, errors,
  confirmations, wording?
- Does every interaction finish cleanly? Check: editors that stay open, focus that returns,
  Escape that cancels, saves that confirm, failures that explain.
- Is it usable from the keyboard and with a screen reader? Check contrast, labels, focus order and
  live announcements.
- On a phone: does it fit without overflow, can a thumb reach it, and are tap targets big enough?
- Does it feel designed or generated? Look for decoration without purpose, filler copy, counts that
  state the obvious, and noise.

## Sweeps (rotate them between rounds)

1. **Visual pass:** screenshot every route and overlay (modals, drawers, palette, menus, popovers)
   across role × theme × viewport, and review each one against the questions.
2. **Interaction pass:** script every way into each editable thing (click, menu, context menu,
   keyboard). Log focus and network, and check every way out (Enter, Escape, click away).
3. **Consistency pass:** inventory every instance of each pattern (pickers, empty states, headers,
   tables, confirmations, toasts, wording) and diff them against each other.
4. **Accessibility pass:** run an automated checker per route, then a keyboard-only run of the main
   flows.
5. **Console pass:** collect every warning and error per route, Svelte runtime warnings included.
6. **Fresh-eyes pass:** take a task a new user would attempt and narrate each step, noting every
   hesitation.

## Evidence

- Before/after screenshots, or a scripted repro that fails before the fix and passes after.
- Consistency findings name every instance that differs.

## Fix principles

- **Fix the shared component, not the page,** so the fix lands everywhere.
- **Remove before you add:** a repeated or decorative element usually goes, rather than being
  restyled.
- **Taste calls are proposals.** Layout direction, palette and copy voice go in a draft PR with one
  commit per option and screenshots, for the user to choose.
- **Never undo a choice the user already made.** Check memory and earlier PRs before changing
  anything they decided.

## Done for a round

Every screen in the matrix was reviewed this round. Each finding was fixed, proposed or deferred.
