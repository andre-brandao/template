import type { UIElement } from "@json-render/svelte";
import { failure } from "../failure";
import { catalog, data, verify } from "./catalog";
import { clean } from "./spec";

type Rows = { columns: { name: string; type: string }[]; rows: unknown[]; truncated: boolean };

// One data block's summary for the model: its shape, or what went wrong.
async function block(
  id: string,
  one: UIElement,
  query: (sql: string) => Promise<Rows>,
  error?: string,
) {
  if (error) return { id, type: one.type, error };
  const [settled] = await Promise.allSettled([query(String(one.props.sql))]);
  if (settled.status === "rejected") return { id, type: one.type, error: failure(settled.reason) };
  return {
    id,
    type: one.type,
    rows: settled.value.rows.length,
    columns: settled.value.columns,
    truncated: settled.value.truncated,
  };
}

/**
 * A spec checked as the user will see it: the catalog's rules, then every data block's SQL
 * through `query`. The model gets the per-block summary, never rows.
 */
export async function check(input: unknown, query: (sql: string) => Promise<Rows>) {
  const spec = clean(input);
  if (!spec) return { ok: false, error: "root is not one of the elements" };
  const checked = catalog.validate(spec);
  if (!checked.success) return { ok: false, error: failure(checked.error) };
  const errors = new Map(verify(spec).map((one) => [one.id, one.error]));
  const blocks = await Promise.all(
    Object.entries(spec.elements)
      .filter(([, one]) => data.has(one.type))
      .map(([id, one]) => block(id, one, query, errors.get(id))),
  );
  // Errors on non-data blocks (a bad Card or Text) count too.
  const rest = [...errors]
    .filter(([id]) => !blocks.some((one) => one.id === id))
    .map(([id, error]) => ({ id, type: spec.elements[id]?.type, error }));
  return {
    ok: !rest.length && !blocks.some((one) => "error" in one),
    blocks: [...blocks, ...rest],
  };
}
