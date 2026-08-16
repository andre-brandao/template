# Core Package Guide

## Build & Test Commands

- `bun typecheck`: Run type checking for this package
- `bun test path/to/file.test.ts`: Run specific test file
- `bun test --watch path/to/file.test.ts`: Run test in watch mode
- `bun db:push`: Apply the schema to the dev database

`db:generate` and `db:migrate` are the user's to run, not an agent's.

## Code Style Guidelines

- **Imports**: Group by source, internal imports after external
- **Types**: Use Zod for runtime validation, explicit TypeScript types for interfaces
- **Naming**: PascalCase for modules/namespaces, camelCase for functions/variables
- **Error Handling**: Use explicit error throwing, wrap DB operations in transactions
- **Module Pattern**: Export functions through namespaces (e.g., `export namespace User`)
- **Testing**: Use `bun:test` with `describe`/`it` pattern and `withTestUser` helper
- **Documentation**: Annotate every Zod schema with `.meta({ description, example })`. These
  schemas are where the OpenAPI spec starts, so a missing description ships all the way to the SDK
- **Database**: Use Drizzle ORM via `Database.use()` for shared db/tx access and `Database.transaction()` when you need an explicit transaction
- **Validation**: Use `fn()` utility for input validation and schema definition. Pass a third
  `{ title, description }` when the op backs an HTTP route or an MCP tool — that prose is what the
  route's `summary`/`description` and the tool's registration both read, so it is written once

## Module Layout

- Default: one module = one `index.ts` exporting a `namespace Foo { ... }`
  (see `todo/`).
- Split into multiple files inside the module directory when `index.ts`
  grows hard to navigate or mixes unrelated concerns (see `user/`, which
  splits profile CRUD (`index.ts`, `User`) from credentials/sessions
  (`auth.ts`, `Auth`)).
- No top-level shim files at `src/<module>.ts` alongside `src/<module>/`.
  Consumers import through the directory via `@template/core/<module>`.
- SQL schemas live next to the module they belong to (`user/user.sql.ts`,
  `user/provider.sql.ts`, `todo/todo.sql.ts`).
- Inside a file, order for a reader asking what the module does, not how:
  schemas and their inferred types, shared constants, exported operations in
  lifecycle order (`create`, `list`, `fromID`, `update`, `remove`), then
  `serialize`, then a `// === UTILS ===` marker with the private helpers below
  it (see `todo/index.ts`). Nothing above the marker is a helper, nothing below
  it is exported. Only `function` declarations hoist, so a value another schema
  derives from — like `Patch` — stays above its use.
- Modules are grouped by tier: `lib/` for swappable infrastructure, `platform/`
  for app-agnostic features, the rest at the top level for the product itself.
  Grouping stays off the import path — `@template/core/key`, not
  `.../platform/key` — so a grouped module needs its own `exports` entry. Which
  tier a new module belongs to: `docs/core.md`.
