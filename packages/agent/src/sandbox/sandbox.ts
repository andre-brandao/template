import {
  defineSandbox,
  type SandboxConfig,
  type SandboxDefinition,
  type SandboxEnsureContext,
  type SandboxHandle,
  type SandboxInstanceStore,
  type SandboxLifecycle,
} from "@tanstack/ai-sandbox";
import type { LockStore } from "@tanstack/ai/locks";

type Tenant = { userId?: string; orgId?: string };
type Input = Omit<SandboxConfig, "id" | "lifecycle"> & {
  id: string;
  tenant?: Tenant;
  lifecycle?: Omit<SandboxLifecycle, "reuse">;
};
type Access = {
  runId: string;
  instances?: SandboxInstanceStore;
  locks?: LockStore;
  signal?: AbortSignal;
  adapterName?: string;
};

function context(definition: SandboxDefinition, input: Access): SandboxEnsureContext {
  return {
    threadId: definition.id,
    runId: input.runId,
    store: input.instances,
    locks: input.locks,
    signal: input.signal,
    adapterName: input.adapterName,
  };
}

export namespace Sandbox {
  /** A concrete reusable sandbox whose identity is independent of chat threads. */
  export function make(input: Input): SandboxDefinition {
    const { tenant, lifecycle, ...config } = input;
    const definition = defineSandbox({
      ...config,
      lifecycle: { ...lifecycle, reuse: "thread" },
    });
    const scope = (ctx: SandboxEnsureContext): SandboxEnsureContext => ({
      ...ctx,
      threadId: input.id,
      tenant,
    });
    return {
      ...definition,
      key: (ctx) => definition.key(scope(ctx)),
      ensure: (ctx) => definition.ensure(scope(ctx)),
      ensureExisting: (ctx) => definition.ensureExisting(scope(ctx)),
      destroy: (ctx) => definition.destroy(scope(ctx)),
    };
  }

  export function ensure(definition: SandboxDefinition, input: Access): Promise<SandboxHandle> {
    return definition.ensure(context(definition, input));
  }

  export function attach(
    definition: SandboxDefinition,
    input: Access,
  ): Promise<SandboxHandle | null> {
    return definition.ensureExisting(context(definition, input));
  }

  export function destroy(definition: SandboxDefinition, input: Access): Promise<void> {
    return definition.destroy(context(definition, input));
  }
}
