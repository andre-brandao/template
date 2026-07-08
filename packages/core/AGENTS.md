# Core Package Guide

## Build & Test Commands

- `bun typecheck`: Run type checking for this package
- `bun test path/to/file.test.ts`: Run specific test file
- `bun test --watch path/to/file.test.ts`: Run test in watch mode
- `bun db:push`: Apply database migrations
- `bun db:connect`: Connect to SQL database

## Code Style Guidelines

- **Imports**: Group by source, internal imports after external
- **Types**: Use Zod for runtime validation, explicit TypeScript types for interfaces
- **Naming**: PascalCase for modules/namespaces, camelCase for functions/variables
- **Error Handling**: Use explicit error throwing, wrap DB operations in transactions
- **Module Pattern**: Export functions through namespaces (e.g., `export namespace User`)
- **Testing**: Use `bun:test` with `describe`/`it` pattern and `withTestUser` helper

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
  `user/provider.sql.ts`, `user/session.sql.ts`, `todo/todo.sql.ts`).
- **Documentation**: Use OpenAPI annotations with Zod schemas
- **Database**: Use Drizzle ORM via `Database.use()` for shared db/tx access and `Database.transaction()` when you need an explicit transaction
- **Validation**: Use `fn()` utility for input validation and schema definition
