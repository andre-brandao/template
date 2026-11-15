import type { Attachment } from "svelte/attachments";

let count = 0;

/**
 * Shared by Modal, Drawer and Command: shows the `<dialog>` as a modal while `open`, closes
 * it on a backdrop click, and names an unlabelled one after its first heading.
 */
export const dialog =
  (open: boolean): Attachment<HTMLDialogElement> =>
  (el) => {
    const click = (e: MouseEvent) => e.target === el && el.close();
    el.addEventListener("click", click);
    if (!open) el.close();
    if (open && !el.open) el.showModal();
    // A microtask, so the body has mounted by the time its heading is looked for.
    if (open && !el.hasAttribute("aria-label"))
      queueMicrotask(() => {
        const head = el.querySelector("h1, h2, h3");
        if (!head) return el.removeAttribute("aria-labelledby");
        head.id ||= `dialog-title-${++count}`;
        el.setAttribute("aria-labelledby", head.id);
      });
    return () => el.removeEventListener("click", click);
  };
