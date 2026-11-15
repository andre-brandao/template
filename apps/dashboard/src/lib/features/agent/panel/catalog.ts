import { defineCatalog, type InferComponentProps, type Spec } from "@json-render/core";
import type { BaseComponentProps } from "@json-render/svelte";
import { schema } from "@json-render/svelte/schema";
import { z } from "zod";

const sql = z.string().max(8000).describe("SELECT already tested with `sql`");

const format = z.enum(["number", "percent"]).nullable().describe("`percent` is 0–100.");

const components = {
  Card: {
    props: z.object({
      title: z.string().max(120).nullable(),
      description: z.string().max(300).nullable(),
    }),
    slots: ["default"],
    description: "Container with an optional title; nest Cards and Rows to compose the UI.",
  },
  Row: {
    props: z.object({}),
    slots: ["default"],
    description: "Lays children side by side, wrapping on narrow screens. Good for 2–4 Metric.",
  },
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
  Text: {
    props: z.object({ content: z.string().max(2000).describe("Short markdown.") }),
    description: "A paragraph of context or a reading of the numbers.",
  },
};

/** What the `panel` tool can build. Data blocks carry their own SQL; the model never sees rows. */
export const catalog = defineCatalog(schema, { components, actions: {} });

type Name = keyof typeof components;

const element = <T extends Name>(type: T) =>
  z.object({
    id: z.string(),
    type: z.literal(type),
    props: components[type].props,
    children: z.array(z.string()),
  });

/** The `panel` tool's input: the spec's elements as a list, turned back into a spec by `clean`. */
export const shape = z.object({
  root: z.string(),
  elements: z.array(
    z.union([
      element("Card"),
      element("Row"),
      element("Metric"),
      element("Chart"),
      element("Table"),
      element("Text"),
    ]),
  ),
});

/** A block component's props; partial, since they render while the spec streams in. */
export type Block<K extends Name> = BaseComponentProps<
  Partial<InferComponentProps<typeof catalog, K>>
>;

/** The blocks that fetch rows, each through its `sql` prop. */
export const data = new Set(["Metric", "Chart", "Table"]);

/**
 * The tool's description. Not `catalog.prompt()`: that one teaches JSONL patches, state and
 * forms, where here every number comes from SQL.
 */
export function instructions() {
  const blocks = Object.entries(catalog.data.components).map(([key, def]) => {
    const props = Object.keys(def.props.shape).join(", ") || "no props";
    const kids = "slots" in def ? " [takes children]" : "";
    return `- ${key} { ${props} }${kids}: ${def.description}`;
  });
  return [
    "Shows the user a UI built from the components below, rendered in the chat while you write it.",
    'Format: { "root": "<id>", "elements": [{ "id", "type", "props", "children": ["<id>", …] }, …] }. The root is any element, usually a Card; Cards and Rows nest freely; ids are short and unique; every element has `children` (empty when it has none); absent props go as null.',
    "Each Metric, Chart and Table runs its own SQL, already tested with `sql`, in the user's browser. You get back only a per-block summary (rows, columns or error): fix errored blocks by calling `panel` again.",
    "Components:",
    ...blocks,
  ].join("\n");
}

/** Each block's props checked against the catalog, which `catalog.validate` leaves to us. */
export function verify(spec: Spec) {
  return Object.entries(spec.elements).flatMap(([id, one]) => {
    const def = catalog.data.components[one.type as Name];
    if (!def) return [{ id, error: `unknown type: ${one.type}` }];
    const result = def.props.safeParse(one.props);
    if (result.success) return [];
    return [
      {
        id,
        error: result.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join("; "),
      },
    ];
  });
}
