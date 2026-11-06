import { createContext } from "svelte";
import type { Spec, UIElement } from "@json-render/svelte";
import { empty, fields, initial, output, type Value } from "./catalog";
import { answer, talk } from "./pending";

// Every field under `key`, in reading order.
function walk(spec: Spec, key: string): UIElement[] {
  const one = spec.elements[key];
  if (!one) return [];
  return [
    ...(fields.has(one.type) ? [one] : []),
    ...(one.children ?? []).flatMap((child) => walk(spec, child)),
  ];
}

/** One `ask` call's answers, read and written by its field blocks. */
export function build(spec: Spec, id: string) {
  const all = walk(spec, spec.root);
  const values = $state<Record<string, Value>>(
    Object.fromEntries(all.map((one) => [String(one.props.name), initial(one)])),
  );
  const ready = () => all.every((one) => !empty(one, values[String(one.props.name)] ?? null));
  return {
    id,
    spec,
    values,
    /** Every required field answered. */
    get ready() {
      return ready();
    },
    send() {
      if (!ready()) return;
      answer(id, output(spec, $state.snapshot(values)));
    },
    /** Folds the form, keeps every answer so far, hands over to the chat. */
    talk() {
      talk(id, output(spec, $state.snapshot(values)).answers);
    },
  };
}

type Form = ReturnType<typeof build>;

export const [form, createForm] = createContext<Form>();
