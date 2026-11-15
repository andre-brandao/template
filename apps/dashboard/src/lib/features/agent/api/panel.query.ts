import { createMutation } from "@tanstack/svelte-query";
import { call, type Done } from "$lib/query";
import {
  createPanel,
  getPanel,
  getPanels,
  getRows,
  removePanel,
  updatePanel,
} from "./panel.remote";

export const panels = () => ({ queryKey: ["panels"], queryFn: call(() => getPanels()) });

export const panel = (id: string) => ({
  queryKey: ["panel", id],
  queryFn: call(() => getPanel(id)),
});

// One block's rows, shared by the `show` tool's check and the block that draws them.
export const rows = (sql: string, limit: number) => ({
  queryKey: ["rows", sql, limit],
  queryFn: call(() => getRows({ sql, limit })),
  staleTime: 60_000,
});

export type Rows = Awaited<ReturnType<typeof getRows>>;

// A panel saved before is overwritten; a new one is created.
const put = (input: Parameters<typeof createPanel>[0] & { id?: string }) =>
  input.id ? updatePanel({ ...input, id: input.id }) : createPanel(input);

export const save = (opts?: Done<typeof put>) =>
  createMutation(() => ({
    mutationFn: call(put),
    meta: { invalidates: [["panels"], ["panel"]] },
    ...opts,
  }));

export const remove = (opts?: Done<typeof removePanel>) =>
  createMutation(() => ({
    mutationFn: call(removePanel),
    meta: { invalidates: [["panels"]] },
    ...opts,
  }));
