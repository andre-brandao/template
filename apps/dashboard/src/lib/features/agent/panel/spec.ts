import type { Spec, UIElement } from "@json-render/svelte";

const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

// The tool sends elements as a list keyed by `id`; saved panels keep a record.
function entries(elements: unknown) {
  if (object(elements)) return Object.entries(elements);
  if (!Array.isArray(elements)) return [];
  return elements.flatMap((one) =>
    object(one) && typeof one.id === "string" ? [[one.id, one] as const] : [],
  );
}

/**
 * A spec json-render can draw, or nothing. Mid-stream the last element may lack its type or
 * props, and json-render needs both.
 */
export function clean(raw: unknown): Spec | undefined {
  if (!object(raw) || typeof raw.root !== "string") return;
  const elements = Object.fromEntries(
    entries(raw.elements).flatMap(([key, one]) =>
      object(one) && typeof one.type === "string" && object(one.props)
        ? [
            [
              key,
              {
                type: one.type,
                props: one.props,
                children: Array.isArray(one.children)
                  ? one.children.filter((child) => typeof child === "string")
                  : [],
              } as UIElement,
            ],
          ]
        : [],
    ),
  );
  if (!elements[raw.root]) return;
  return { root: raw.root, elements };
}

/** The root's title, for a saved panel's name. */
export function title(spec: Spec) {
  const value = spec.elements[spec.root]?.props.title;
  return typeof value === "string" && value.trim() ? value.trim() : "Panel";
}
