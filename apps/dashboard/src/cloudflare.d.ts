// The worker's bindings. adapter-cloudflare provides the module on that target; vite.config
// stubs it with an empty `env` everywhere else.
declare module "cloudflare:workers" {
  export const env: {
    Hyperdrive?: { connectionString: string };
    Files?: import("@cloudflare/workers-types").R2Bucket;
    Jobs?: import("@cloudflare/workers-types").Queue<import("@template/core/queue/port").Job>;
  };
}
