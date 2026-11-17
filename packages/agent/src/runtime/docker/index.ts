import { dockerSandbox } from "@tanstack/ai-sandbox-docker";

export namespace Docker {
  export const make = dockerSandbox;
}
