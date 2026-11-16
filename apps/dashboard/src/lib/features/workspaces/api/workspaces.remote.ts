import { getRequestEvent } from "$app/server";
import { z } from "zod";
import { Workspace } from "@template/core/workspace";
import { Workspaces } from "@template/core/workspaces";
import { remote } from "#lib/server/gate.ts";

// The `workspace` cookie picks the tenant in multi mode; `tenancy` reads it on every request.
const pin = (slug: string) =>
  getRequestEvent().cookies.set("workspace", slug, { path: "/", httpOnly: true, sameSite: "lax" });

export const getMode = remote.query(z.void(), () => Workspace.mode());

export const getCurrent = remote.core(Workspaces.current).query();

export const getMine = remote.core(Workspaces.list).query();

export const getMembers = remote.core(Workspaces.members).query();

// Sizes join in by schema: two queries in all, never one per workspace. Biggest first.
export const getRegistry = remote.query(z.void(), async () => {
  const rows = await Workspaces.registry();
  const use = await Workspaces.usage({});
  const bytes = (schema: string) => use.find((one) => one.schema === schema)?.bytes ?? 0;
  return {
    rows: rows
      .map((row) => ({ ...row, bytes: bytes(row.schema) }))
      .sort((a, b) => b.bytes - a.bytes),
    central: bytes("central"),
  };
});

export const getInspect = remote.core(Workspaces.inspect).query();

export const getUsage = remote.core(Workspaces.usage).query();

// Forms rather than commands so a refusal (last owner, taken slug) lands as a form issue.
export const saveWorkspace = remote.form(Workspaces.update.schema, async (input) => {
  const here = await Workspaces.current();
  const next = await Workspaces.update(input);
  // A moved slug would strand the cookie that picks this workspace.
  if (Workspace.mode() === "multi" && here?.id === next.id) pin(next.slug);
  return next;
});

export const setRole = remote.form(Workspaces.role.schema, (input) => Workspaces.role(input));

export const createWorkspace = remote.form(Workspaces.create.schema, (input) =>
  Workspaces.create(input),
);

// `resolve` is the membership check, and it refuses outright in single mode.
export const switchWorkspace = remote.command(
  z.object({ slug: Workspaces.Info.shape.slug }),
  async (input) => {
    await Workspaces.resolve(input.slug);
    pin(input.slug);
  },
);

export const retrySetup = remote.core(Workspaces.retry).command();
