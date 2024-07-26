# Deds Template

My opinionated template for creating fast marketing websites that can have some
more flavour if you put in the work

### Installation

Clone the repository and install the dependencies:

```bash
git clone https://github.com/andre-brandao/template

cd deds-template

npm install
# or
pnpm install
# or
yarn install
# or
bun install
```

## Libraries docs

- [DaisyUI](https://daisyui.com/components/) component library
- [SvelteAnimations](https://animation-svelte.vercel.app/) component library
- [Tailwind](https://tailwindcomponents.com/cheatsheet/) css classes but simple
  sometimes too simple
- [Drizzle](https://orm.drizzle.team/) sql orm
- [Lucia Auth](https://lucia-auth.com/) auth helper for sessions
- [TRPC](https://trpc.io/docs) typesafe api
- [TRPC SvelteKit](https://icflorescu.github.io/trpc-sveltekit/) trpc svelte
  adapter
- [Zod](https://zod.dev/) Type Validations
- [LayerCHart](https://www.layerchart.com/) Beutiful Charts

- [Svelte5](https://svelte-5-preview.vercel.app/docs/introduction)
- [SvelteKit](https://kit.svelte.dev/docs/introduction)
- [Svelte Tutorial](https://learn.svelte.dev/tutorial/introducing-sveltekit)

## Project Structure

Briefly explain the main directories and files in your project:

- src/: Source code for your application.
- src/routes/: SvelteKit routes.
- src/lib/: Reusable modules and components.
- src/lib/components: UI Components.
- src/lib/paraglide: Translations for the app (in gitignore).
- src/lib/stores: Aplication stores (global state).
- src/lib/utils: Utils for many things
- src/lib/server/db/: Database-related scripts and schema.
- src/assets: Static Assets
- src/trpc: Server side trpc routes
- messages: translation definition
- migrations: sql migrations

## Developing

Once you've cloned the project and installed dependencies with `npm install` (or
`pnpm install`, `yarn` or `bun`), start a development server:

```bash
npm run dev
```

## Building

To create a production version of your app:

```bash
npm run build
```

## Testing

TODO

## Drizzle

Drizzle ORM Commands The following commands help manage the database schema and
migrations, refer to [Commands Docs](https://orm.drizzle.team/kit-docs/commands)

Push changes to the development database:

```bash
npm run db:push
```

Apply database migrations:

```bash
npm run db:migrate --name <migration name>
```

Open Drizzle Studio:

```bash
npm run db:studio
```

Seed the database using faker.js:

```bash
npm run db:seed
```

Generate database types:

```bash
npm run db:generate
```

Drop the database:

```bash
npm run db:drop
```

Bring the database up (alias for db:push and db:migrate):

```bash
npm run db:up
```

Check the database schema:

```bash
npm run db:check
```

# Contributing

Feel free to submit issues or pull requests. Contributions are welcome!
