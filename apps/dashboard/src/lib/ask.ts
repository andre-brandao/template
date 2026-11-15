import { createRawSnippet } from "svelte";
import { modal } from "@template/ui";

/**
 * The one destructive confirm. `{name}` in `warn` renders bold; `verify` makes the reader type
 * the name back. Resolves `true` to go ahead; the write's own Status shows how it went.
 */
export const ask = (opts: {
  title: string;
  action?: string;
  name: string;
  warn: string;
  verify?: boolean;
}) =>
  modal.confirm({
    title: opts.title,
    action: opts.action ?? opts.title,
    verify: opts.verify ? opts.name : undefined,
    body: createRawSnippet(() => ({
      render: () => "<span></span>",
      setup: (el) => {
        const bold = document.createElement("b");
        bold.textContent = opts.name;
        el.append(...opts.warn.split("{name}").flatMap((part, i) => (i ? [bold, part] : [part])));
      },
    })),
  });
