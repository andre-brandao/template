import type { Spec } from "@json-render/core";
import type { BaseComponentProps } from "@json-render/svelte";
import { z } from "zod";

type Def = { props: z.ZodObject; slots?: string[]; description: string };

/** The layout blocks `ask` and `panel` share, so both draw the same Card, Row and Text. */
export const layout = {
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
  Text: {
    props: z.object({ content: z.string().max(2000).describe("Short markdown.") }),
    description: "A paragraph of context or a reading of the numbers.",
  },
} satisfies Record<string, Def>;

/** A layout block's props; partial, since they render while the spec streams in. */
export type Layout<K extends keyof typeof layout> = BaseComponentProps<
  Partial<z.infer<(typeof layout)[K]["props"]>>
>;

/** A spec tool's input: the elements as a list, turned back into a spec by `clean`. */
export const shape = (defs: Record<string, Def>) =>
  z.object({
    root: z.string(),
    elements: z.array(
      z.union(
        Object.entries(defs).map(([type, def]) =>
          z.object({
            id: z.string(),
            type: z.literal(type),
            props: def.props,
            children: z.array(z.string()),
          }),
        ),
      ),
    ),
  });

/** One line per component, for a tool's description. */
export const describe = (defs: Record<string, Def>) =>
  Object.entries(defs).map(
    ([key, def]) =>
      `- ${key} { ${Object.keys(def.props.shape).join(", ") || "no props"} }${def.slots ? " [takes children]" : ""}: ${def.description}`,
  );

/** Each element's props checked against `defs`, which `catalog.validate` leaves to us. */
export function verify(defs: Record<string, Def>, spec: Spec) {
  return Object.entries(spec.elements).flatMap(([id, one]) => {
    const def = defs[one.type];
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
