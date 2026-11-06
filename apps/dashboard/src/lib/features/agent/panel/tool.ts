import { toolDefinition } from "@tanstack/ai";
import type { UIElement } from "@json-render/svelte";
import { failure } from "../failure";
import { catalog, data, instructions, shape, verify } from "./catalog";
import { fetchRows } from "./rows";
import { clean } from "./spec";

// One data block's summary for the model: its shape, or what went wrong.
async function block(id: string, one: UIElement, error?: string) {
  if (error) return { id, type: one.type, error };
  const [settled] = await Promise.allSettled([fetchRows(String(one.props.sql))]);
  if (settled.status === "rejected") return { id, type: one.type, error: failure(settled.reason) };
  return {
    id,
    type: one.type,
    rows: settled.value.rows.length,
    columns: settled.value.columns,
    truncated: settled.value.truncated,
  };
}

/** The `panel` page tool: blocks fetch their rows here, as the user; the model gets a summary. */
export function panel() {
  return toolDefinition({ name: "panel", description: instructions(), inputSchema: shape }).client(
    async (input) => {
      const spec = clean(input);
      if (!spec) return { ok: false, error: "root is not one of the elements" };
      const checked = catalog.validate(spec);
      if (!checked.success) return { ok: false, error: failure(checked.error) };
      const errors = new Map(verify(spec).map((one) => [one.id, one.error]));
      const blocks = await Promise.all(
        Object.entries(spec.elements)
          .filter(([, one]) => data.has(one.type))
          .map(([id, one]) => block(id, one, errors.get(id))),
      );
      // Errors on non-data blocks (a bad Card or Text) count too.
      const rest = [...errors]
        .filter(([id]) => !blocks.some((one) => one.id === id))
        .map(([id, error]) => ({ id, type: spec.elements[id]?.type, error }));
      return {
        ok: !rest.length && !blocks.some((one) => "error" in one),
        blocks: [...blocks, ...rest],
      };
    },
  );
}
