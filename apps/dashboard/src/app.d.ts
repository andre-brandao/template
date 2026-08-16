// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    interface Error {
      message: string;
      code?: string;
    }
    interface Locals {
      session: import("$lib/server/session").Session | null;
    }
    interface PageData {
      /** The section's shell nav, contributed by its `+layout.ts`. Absent = no shell. */
      nav?: import("$lib/components/layout/nav").Nav;
    }
    interface PageState {
      /** Id a peeked link pushed; the page hosting the link renders it in a drawer. */
      selected?: string;
    }
    interface Platform {
      env?: {
        Hyperdrive?: { connectionString: string };
        Files?: import("@cloudflare/workers-types").R2Bucket;
        Jobs?: import("@cloudflare/workers-types").Queue<import("@template/core/queue/port").Job>;
      };
    }
  }
}

export {};
