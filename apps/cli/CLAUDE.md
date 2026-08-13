# @template/cli

The one entrypoint that runs and talks to the template. Bun-only, no build step —
`src/index.ts` is the bin.

## Commands

- `bun typecheck` — type check this package (never call `tsc` directly)
- `bun test` — run tests from this directory, not the repo root
- `bun run build` — compile a standalone binary to `bin/template-cli`

## Layout

| File            | Owns                                                                 |
| --------------- | -------------------------------------------------------------------- |
| `src/index.ts`  | Command table + help text. Every command is one entry in `commands`. |
| `src/serve.ts`  | `serve api\|mcp\|auth\|dashboard`                                    |
| `src/api.ts`    | SDK reflection, param parsing, result printing                       |
| `src/auth.ts`   | `login` (browser PKCE), `logout`, `whoami`                           |
| `src/config.ts` | `~/.config/template/config.json` read/write + token/url resolution   |
| `src/args.ts`   | Raw `--flag` helpers (`value`, `strip`)                              |

## Rules

- **Never hardcode API method names.** `api.ts` reflects `TemplateSdk.prototype`, so
  new endpoints appear automatically after `bun run gen`. Adding a method to the
  command surface should require zero edits here.
- **Adding a command** = add one function and one entry in `commands` in `index.ts`,
  then update the `help` string in the same file. Commands take `rest: string[]`.
- **Adding a serve target** = add one entry to `targets` in `serve.ts`.
- Resolution order is defined once in `config.ts` and must stay that way:
  token is `--token` › `TEMPLATE_TOKEN` › saved `sk-` key › OAuth access (auto-refreshed);
  url is `--url` › `API_URL` › saved config › `http://localhost:3000`.
- `serve api`/`serve mcp`/`serve auth` must wrap the fetch handler in
  `Database.provide(url, ...)`. Dev pglite allows only one live connection, so a
  per-request client will fail against it.
- Output goes through `output()` in `api.ts`: JSON to stdout, errors to stderr with a
  non-zero exit. Keep the CLI pipeable.
- Env read by this package: `API_URL`, `AUTH_URL`, `TEMPLATE_TOKEN`, `PORT`, `MCP_PORT`,
  `DATABASE_URL`, `AUTH_PERSIST`, `XDG_CONFIG_HOME`.

## Tests

- `test/cli.test.ts` — arg parsing, SDK reflection, client plumbing, `output()`.
- `test/config.test.ts` — the token/url/issuer resolution order and `write`/`clear`,
  against a real config file.
- `test/setup.ts` (preloaded via `bunfig.toml`) — points `XDG_CONFIG_HOME` at a scratch
  dir and clears `TEMPLATE_TOKEN`/`API_URL`/`AUTH_URL`. It has to be a preload because
  `config.ts` freezes its file path at import.

Keep new tests in that shape: no server, no network, no subprocess. Anything needing a
live server belongs in e2e. Untested by design — `login()` (browser + port 3006), all of
`serve.ts`, the OAuth refresh branch of `config.token()` (needs a reachable issuer), and
the error branch of `output()` (`process.exit` would kill the runner).

## Docs

Update `README.md` (human-facing) and the `help` string in `src/index.ts` together
whenever a command or flag changes. `skill/SKILL.md` is the agent-facing usage guide.
