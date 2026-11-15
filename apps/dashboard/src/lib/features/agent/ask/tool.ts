import { toolDefinition } from "@tanstack/ai";
import { message } from "$lib/query";
import { clean } from "../render/spec";
import { catalog, instructions, shape, verify, type Output } from "./catalog";
import { wait } from "./pending";

// A bad spec goes back to the model to fix.
const invalid = (reason: string): Output => ({
  answered: false,
  invalid: true,
  reason: `Invalid form: ${reason}`,
});

/** The `ask` page tool: the form waits in the chat until the user answers it. */
export function ask() {
  return toolDefinition({ name: "ask", description: instructions(), inputSchema: shape }).client(
    async (input, opts) => {
      const spec = clean(input);
      if (!spec) return invalid("root is not one of the elements");
      const checked = catalog.validate(spec);
      const errors = [
        ...(checked.success ? [] : [message(checked.error)]),
        ...verify(spec).map((one) => `${one.id}: ${one.error}`),
      ];
      if (errors.length) return invalid(errors.join("; "));
      return wait(opts?.toolCallId ?? crypto.randomUUID());
    },
  );
}
