/**
 * A thin DSL for mail bodies. A component is any function returning a `Node`, so both the
 * HTML and the plain text fall out of one description. Inline styles and table layout on
 * purpose: Outlook renders through Word, and the Gmail app strips `<style>`.
 */

/** A rendered fragment — both bodies at once. */
export type Node = { html: string; text: string };

/** What a component takes: a plain string (escaped) or another node (passed through). */
export type Child = string | Node;

/** Edit these to rebrand every email. */
export const theme = {
  bg: "#f4f5f7",
  card: "#ffffff",
  ink: "#111827",
  mute: "#6b7280",
  accent: "#111827",
  line: "#e5e7eb",
  font: "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif",
  mono: "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace",
};

const ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
};

/** Both bodies from one list of nodes. Spreads straight into `Email.send`. */
export function render(nodes: Node[]) {
  return {
    body: nodes
      .map((node) => node.text)
      .filter(Boolean)
      .join("\n\n"),
    html: shell(nodes.map((node) => node.html).join("")),
  };
}

/** Escapes a value for HTML. Exported so a custom component can interpolate safely. */
export function esc(value: string) {
  return value.replace(/[&<>"]/g, (char) => ENTITIES[char]!);
}

/** Strings escaped, nodes passed through — how every component folds its children. */
export function join(kids: Child[]): Node {
  return {
    html: kids.map((kid) => (typeof kid === "string" ? esc(kid) : kid.html)).join(""),
    text: kids.map((kid) => (typeof kid === "string" ? kid : kid.text)).join(""),
  };
}

/** Hidden preview line — the snippet a client shows next to the subject. Put it first. */
export function preview(value: string): Node {
  return {
    html: `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(value)}</div>`,
    text: "",
  };
}

export function head(...kids: Child[]): Node {
  const kid = join(kids);
  return {
    html: `<h1 style="margin:0 0 16px;font:600 22px/1.3 ${theme.font};color:${theme.ink}">${kid.html}</h1>`,
    text: kid.text,
  };
}

export function text(...kids: Child[]): Node {
  const kid = join(kids);
  return {
    html: `<p style="margin:0 0 16px;font:400 16px/1.6 ${theme.font};color:${theme.ink}">${kid.html}</p>`,
    text: kid.text,
  };
}

export function small(...kids: Child[]): Node {
  const kid = join(kids);
  return {
    html: `<p style="margin:0 0 8px;font:400 13px/1.5 ${theme.font};color:${theme.mute}">${kid.html}</p>`,
    text: kid.text,
  };
}

export function bold(...kids: Child[]): Node {
  const kid = join(kids);
  return { html: `<strong>${kid.html}</strong>`, text: kid.text };
}

/** Inline. The text side keeps the url visible — a plain-text reader can't click a label. */
export function link(label: string, href: string): Node {
  return {
    html: `<a href="${esc(href)}" style="color:${theme.accent};text-decoration:underline">${esc(label)}</a>`,
    text: label === href ? href : `${label} (${href})`,
  };
}

/** A value read off the screen — an OTP, a token. */
export function code(value: string): Node {
  return {
    html: `<div style="margin:0 0 16px;padding:16px;background:${theme.bg};border-radius:8px;font:600 28px/1.2 ${theme.mono};letter-spacing:6px;text-indent:6px;text-align:center;color:${theme.ink}">${esc(value)}</div>`,
    text: value,
  };
}
/** Table-wrapped so Outlook paints the background; the padding lives on the anchor. */
export function button(label: string, href: string): Node {
  return {
    html: [
      `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px">`,
      `<tr><td align="center" bgcolor="${theme.accent}" style="border-radius:8px">`,
      `<a href="${esc(href)}" style="display:inline-block;padding:12px 24px;font:600 15px/1 ${theme.font};color:${theme.card};text-decoration:none">${esc(label)}</a>`,
      `</td></tr></table>`,
    ].join(""),
    text: `${label}: ${href}`,
  };
}

export function list(items: Child[]): Node {
  const kids = items.map((item) => join([item]));
  return {
    html: [
      `<ul style="margin:0 0 16px;padding:0 0 0 20px;font:400 16px/1.6 ${theme.font};color:${theme.ink}">`,
      ...kids.map((kid) => `<li>${kid.html}</li>`),
      `</ul>`,
    ].join(""),
    text: kids.map((kid) => `- ${kid.text}`).join("\n"),
  };
}

/** `cols` are the header labels; every row must be the same length. */
export function table(cols: string[], rows: Child[][]): Node {
  const cells = rows.map((row) => row.map((cell) => join([cell])));
  const width = cols.map((col, i) =>
    Math.max(col.length, ...cells.map((row) => row[i]?.text.length ?? 0)),
  );
  const pad = (values: string[]) =>
    values
      .map((v, i) => v.padEnd(width[i]!))
      .join("  ")
      .trimEnd();
  return {
    html: [
      `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 16px;border-collapse:collapse;font:400 14px/1.5 ${theme.font};color:${theme.ink}">`,
      `<tr>`,
      ...cols.map(
        (col) =>
          `<th align="left" style="padding:8px 12px;border-bottom:2px solid ${theme.line};font-weight:600;color:${theme.mute}">${esc(col)}</th>`,
      ),
      `</tr>`,
      ...cells.flatMap((row) => [
        `<tr>`,
        ...row.map(
          (cell) =>
            `<td align="left" style="padding:8px 12px;border-bottom:1px solid ${theme.line}">${cell.html}</td>`,
        ),
        `</tr>`,
      ]),
      `</table>`,
    ].join(""),
    text: [pad(cols), ...cells.map((row) => pad(row.map((cell) => cell.text)))].join("\n"),
  };
}

export function rule(): Node {
  return {
    html: [
      `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 16px">`,
      `<tr><td height="1" style="background:${theme.line};font-size:0;line-height:0">&nbsp;</td></tr>`,
      `</table>`,
    ].join(""),
    text: "---",
  };
}

// === UTILS ===

/** The centered card. Nested tables because Word has no `max-width`. */
function shell(inner: string) {
  return [
    `<!doctype html><html><head><meta charset="utf-8">`,
    `<meta name="viewport" content="width=device-width,initial-scale=1"></head>`,
    `<body style="margin:0;padding:0;background:${theme.bg}">`,
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${theme.bg}">`,
    `<tr><td align="center" style="padding:32px 12px">`,
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:100%;max-width:600px;background:${theme.card};border-radius:10px">`,
    `<tr><td style="padding:32px">${inner}</td></tr>`,
    `</table></td></tr></table></body></html>`,
  ].join("");
}
