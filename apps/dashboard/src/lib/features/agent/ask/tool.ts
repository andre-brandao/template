import { toolDefinition } from "@tanstack/ai";
import { failure } from "../failure";
import { clean } from "../panel/spec";
import { catalog, instructions, shape, verify } from "./catalog";
import { wait } from "./pending";

/** The `ask` page tool: the form waits in the chat until the user answers it. */
export function ask() {
  return toolDefinition({ name: "ask", description: instructions(), inputSchema: shape }).client(
    async (input, opts) => {
      const spec = clean(input);
      if (!spec)
        return { answered: false, reason: "Invalid form: root is not one of the elements" };
      const checked = catalog.validate(spec);
      // A bad spec goes back to the model to fix.
      const errors = [
        ...(checked.success ? [] : [failure(checked.error)]),
        ...verify(spec).map((one) => `${one.id}: ${one.error}`),
      ];
      if (errors.length) return { answered: false, reason: `Invalid form: ${errors.join("; ")}` };
      return wait(opts?.toolCallId ?? crypto.randomUUID());
    },
  );
}
