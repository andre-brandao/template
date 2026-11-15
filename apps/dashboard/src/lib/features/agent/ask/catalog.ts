import { defineCatalog, type InferComponentProps, type Spec } from "@json-render/core";
import type { BaseComponentProps } from "@json-render/svelte";
import { schema } from "@json-render/svelte/schema";
import { z } from "zod";
import { catalog as panel } from "../panel/catalog";

const name = z.string().max(40).describe("The answer's key, unique in the form, e.g. `period`.");
const label = z.string().max(200).describe("The question.");
const hint = z.string().max(300).nullable().describe("One line of context under it.");
const reason = z
  .string()
  .max(200)
  .nullable()
  .describe("Why you picked the suggestion, from what you found: `It is this page's project`.");

const options = z
  .array(
    z.object({
      value: z.string().max(80),
      label: z.string().max(80),
      description: z.string().max(160).nullable(),
    }),
  )
  .min(2)
  .max(5);

// Layout blocks are the panel's own, so both draw the same Card, Row and Text.
const layout = panel.data.components;

const components = {
  Form: {
    props: z.object({
      title: z.string().max(120),
      description: z.string().max(300).nullable(),
      submit: z.string().max(40).nullable().describe("The send button's label; `Send` if null."),
    }),
    slots: ["default"],
    description:
      "The root. Its field children are the questions; Card and Text children give shared context.",
  },
  Card: layout.Card,
  Row: layout.Row,
  Text: layout.Text,
  Choice: {
    props: z.object({
      name,
      label,
      hint,
      reason,
      options,
      recommended: z.string().nullable().describe("The `value` you recommend; starts selected."),
    }),
    description: "Pick one option.",
  },
  MultiChoice: {
    props: z.object({
      name,
      label,
      hint,
      reason,
      options,
      recommended: z.array(z.string()).nullable().describe("The `value`s you recommend."),
    }),
    description: "Pick any number of options.",
  },
  TextField: {
    props: z.object({
      name,
      label,
      hint,
      reason,
      default: z.string().max(2000).nullable().describe("Prefilled answer the user can edit."),
      placeholder: z.string().max(120).nullable(),
      multiline: z.boolean(),
      required: z.boolean(),
    }),
    description: "Free text.",
  },
  NumberField: {
    props: z.object({
      name,
      label,
      hint,
      reason,
      default: z.number().nullable(),
      min: z.number().nullable(),
      max: z.number().nullable(),
      unit: z.string().max(20).nullable().describe("Shown after the field: `days`, `%`."),
      required: z.boolean(),
    }),
    description: "A number.",
  },
  DateField: {
    props: z.object({
      name,
      label,
      hint,
      reason,
      default: z.string().nullable().describe("`YYYY-MM-DD`."),
      required: z.boolean(),
    }),
    description: "A date.",
  },
  Confirm: {
    props: z.object({
      name,
      label,
      hint,
      reason,
      recommended: z.boolean().nullable().describe("Your recommendation; starts selected."),
    }),
    description: "Yes or no.",
  },
};

/**
 * What the `ask` tool can build: a json-render catalog of its own, apart from the panel's,
 * so the model never mixes questions into a panel. Fields hold answers; layout is the panel's.
 */
export const catalog = defineCatalog(schema, { components, actions: {} });

type Name = keyof typeof components;

/** A component's props; partial, since they render while the spec streams in. */
export type Block<K extends Name> = BaseComponentProps<
  Partial<InferComponentProps<typeof catalog, K>>
>;

/** The components that hold an answer, under their `name`. */
export const fields = new Set<string>([
  "Choice",
  "MultiChoice",
  "TextField",
  "NumberField",
  "DateField",
  "Confirm",
]);

const element = <T extends Name>(type: T) =>
  z.object({
    id: z.string(),
    type: z.literal(type),
    props: components[type].props,
    children: z.array(z.string()),
  });

/** The tool's input: the spec's elements as a list, like `panel`'s. */
export const shape = z.object({
  root: z.string(),
  elements: z.array(
    z.union([
      element("Form"),
      element("Card"),
      element("Row"),
      element("Text"),
      element("Choice"),
      element("MultiChoice"),
      element("TextField"),
      element("NumberField"),
      element("DateField"),
      element("Confirm"),
    ]),
  ),
});

/** One answer as the form holds it. */
export type Value = string | string[] | number | boolean | null;

export type Answer = {
  name: string;
  label: string;
  answer: string;
  value: Value;
  recommended: boolean;
};

/**
 * What the tool returns: the answers, or the user left the form for the chat, with what they
 * had picked so far in `partial`.
 */
export type Output =
  | { answered: true; answers: Answer[] }
  | { answered: false; reason: string; partial?: Answer[] };

export function instructions() {
  const blocks = Object.entries(catalog.data.components).map(([key, def]) => {
    const props = Object.keys(def.props.shape).join(", ") || "no props";
    const kids = "slots" in def ? " [takes children]" : "";
    return `- ${key} { ${props} }${kids}: ${def.description}`;
  });
  return [
    "Clarifies with the user before you act: you show what you assumed, already answered, and the user confirms with one click or changes only what is wrong. Look things up first (the page, the data tools) so you arrive with answers, not questions.",
    "Every field you can guess carries `recommended`/`default` plus a short `reason`. Leave a field without a suggestion only when you truly cannot guess. Options are the 2–5 plausible ones, never an exhaustive list. One call with everything you need now, never one call per question.",
    'Format: { "root": "<id>", "elements": [{ "id", "type", "props", "children": ["<id>", …] }, …] }. The root is a Form whose children are the questions (1–6); the user can always answer a Choice or MultiChoice with free text, so never add an "other" option. Every element has `children` (empty when none); absent props go as null.',
    "You get back `answers`: per field `answer` (readable), `value` (raw) and `recommended: true` when the user kept your suggestion. `answered: false` means the user left the form for the chat: `reason` carries what they wrote and `partial` what they had picked. Answer that in text, then call `ask` again only if something is still open.",
    "Not for showing data (that is `panel`), and not to confirm an action the user already asked for.",
    "Components:",
    ...blocks,
  ].join("\n");
}

/** Each element's props checked against the catalog, which `catalog.validate` leaves to us. */
export function verify(spec: Spec) {
  const names = Object.values(spec.elements)
    .filter((one) => fields.has(one.type))
    .map((one) => String(one.props.name));
  const dupes = names.filter((one, i) => names.indexOf(one) !== i);
  return [
    ...dupes.map((one) => ({ id: one, error: `duplicate field name: ${one}` })),
    ...Object.entries(spec.elements).flatMap(([id, one]) => {
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
    }),
  ];
}

type Field = { type: string; props: Record<string, unknown> };

/** Where a field starts: the recommendation, the default, or empty. */
export function initial(field: Field): Value {
  const props = field.props;
  if (field.type === "MultiChoice") return (props.recommended as string[] | null) ?? [];
  if (field.type === "Choice" || field.type === "Confirm")
    return (props.recommended as string | boolean | null) ?? null;
  return (props.default as string | number | null) ?? null;
}

/** Whether a field still needs an answer before the form can be sent. */
export function empty(field: Field, value: Value) {
  const optional =
    ["TextField", "NumberField", "DateField"].includes(field.type) && !field.props.required;
  if (optional) return false;
  return value === null || value === "" || (Array.isArray(value) && !value.length);
}

/** The answer in words, for the model and the summary: option labels instead of values. */
function readable(field: Field, value: Value) {
  if (value === null || value === "" || (Array.isArray(value) && !value.length)) return "—";
  if (field.type === "Confirm") return value ? "Yes" : "No";
  if (field.type === "NumberField")
    return `${value}${field.props.unit ? ` ${field.props.unit}` : ""}`;
  if (field.type === "Choice" || field.type === "MultiChoice") {
    const list = (field.props.options as { value: string; label: string }[] | null) ?? [];
    return [value]
      .flat()
      .map((one) => list.find((option) => option.value === one)?.label ?? String(one))
      .join(", ");
  }
  return String(value);
}

/** Whether the answer is the one the model suggested. */
function kept(field: Field, value: Value) {
  const start = initial(field);
  if (empty({ ...field, props: { ...field.props, required: true } }, start)) return false;
  return JSON.stringify(start) === JSON.stringify(value);
}

/** The tool's output from the form's answers, in the spec's order. */
export function output(
  spec: Spec,
  values: Record<string, Value>,
): Extract<Output, { answered: true }> {
  return {
    answered: true,
    answers: Object.values(spec.elements)
      .filter((one) => fields.has(one.type))
      .map((one) => {
        const key = String(one.props.name);
        const value = values[key] ?? null;
        return {
          name: key,
          label: String(one.props.label),
          answer: readable(one, value),
          value,
          recommended: kept(one, value),
        };
      }),
  };
}
