/** A replacement of `value[from, to)` with `text`, leaving the caret at `[start, end)`. */
export type Edit = { text: string; from: number; to: number; start: number; end: number };

/** Toggles a symmetric marker such as `**` or `` ` `` around the selection. */
export function wrap(value: string, from: number, to: number, mark: string): Edit {
  const sel = value.slice(from, to);
  const off = mark.length;
  if (value.slice(from - off, from) === mark && value.slice(to, to + off) === mark)
    return { text: sel, from: from - off, to: to + off, start: from - off, end: to - off };
  return { text: mark + sel + mark, from, to, start: from + off, end: to + off };
}

/** Toggles a line marker such as `- ` or `> ` across every line the selection touches. */
export function prefix(value: string, from: number, to: number, mark: string): Edit {
  const head = value.lastIndexOf("\n", from - 1) + 1;
  const nl = value.indexOf("\n", to);
  const tail = nl === -1 ? value.length : nl;
  const lines = value.slice(head, tail).split("\n");
  const on = lines.every((line) => line.startsWith(mark));
  const text = lines.map((line) => (on ? line.slice(mark.length) : mark + line)).join("\n");
  return { text, from: head, to: tail, start: head, end: head + text.length };
}

/** Wraps the selection in a link, selecting the placeholder href. */
export function link(value: string, from: number, to: number): Edit {
  const sel = value.slice(from, to) || "text";
  return {
    text: `[${sel}](url)`,
    from,
    to,
    start: from + sel.length + 3,
    end: from + sel.length + 6,
  };
}

/** Wraps the selection in a fenced block, leaving the caret on the language slot. */
export function fence(value: string, from: number, to: number): Edit {
  const text = "```\n" + value.slice(from, to) + "\n```";
  return { text, from, to, start: from + 3, end: from + 3 };
}
