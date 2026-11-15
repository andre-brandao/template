import { defineCatalog, type InferComponentProps, type Spec } from "@json-render/core";
import type { BaseComponentProps } from "@json-render/svelte";
import { schema } from "@json-render/svelte/schema";
import { z } from "zod";
import * as render from "../render/catalog";

const sql = z.string().max(8000).describe("SELECT already tested with `sql`");

const format = z.enum(["number", "percent"]).nullable().describe("`percent` is 0–100.");

const components = {
  Card: render.layout.Card,
  Row: render.layout.Row,
  Metric: {
    props: z.object({
      sql,
      label: z.string().max(80),
      column: z
        .string()
        .nullable()
        .describe("Column holding the number; the first numeric one if null."),
      format,
    }),
    description: "One big number from the first row.",
  },
  Chart: {
    props: z.object({
      sql,
      title: z.string().max(120),
      x: z.string().nullable().describe("The label column: the category or the date."),
      y: z.string().nullable().describe("The numeric column; the first numeric one if null."),
      format,
    }),
    description: "Horizontal bars, one per row, in the SQL's row order.",
  },
  Table: {
    props: z.object({ sql, title: z.string().max(120) }),
    description: "A table with every column of the result, for lists.",
  },
  Text: render.layout.Text,
};

/** What a panel can be built from. Data blocks carry their own SQL; the model never sees rows. */
export const catalog = defineCatalog(schema, { components, actions: {} });

type Name = keyof typeof components;

/** `show` and `draft` input: the elements as a list, turned back into a spec by `clean`. */
export const shape = render.shape(components);

/** A block component's props; partial, since they render while the spec streams in. */
export type Block<K extends Name> = BaseComponentProps<
  Partial<InferComponentProps<typeof catalog, K>>
>;

/** The blocks that fetch rows through their `sql` prop, and the rows each one draws. */
export const limits = { Metric: 1, Chart: 50, Table: 200 };

export const data = new Map(Object.entries(limits));

/**
 * A spec tool's description, after its own `lead`. Not `catalog.prompt()`: that one teaches
 * JSONL patches, state and forms, where here every number comes from SQL.
 */
export function instructions(lead: string) {
  return [
    lead,
    'Format: { "root": "<id>", "elements": [{ "id", "type", "props", "children": ["<id>", …] }, …] }. The root is any element, usually a Card; Cards and Rows nest freely; ids are short and unique; every element has `children` (empty when it has none); absent props go as null.',
    "Each Metric, Chart and Table runs its own SQL, already tested with `sql`. You get back only a per-block summary (rows, columns or error): fix errored blocks and call again.",
    "Components:",
    ...render.describe(components),
  ].join("\n");
}

/** Each block's props checked against the catalog. */
export const verify = (spec: Spec) => render.verify(components, spec);
