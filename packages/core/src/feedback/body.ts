import { Tags, Urgencies, type Comment, type Detail, type Filter, type Row } from "./port";

/** An issue reduced to what every adapter can report. */
export type Raw = Omit<Row, "tag" | "urgency" | "from" | "user"> & { body: string };

type Context = {
  body: string;
  tag: string;
  urgency?: string;
  page?: string;
  agent?: string;
  viewport?: string;
  locale?: string;
  timezone?: string;
};

type Sender = { id: string; name: string; email: string };
type File = { name: string; type: string; url: string };

const RULE = "\n---\nPage: ";

/** Threads are found again by this marker, so their title is free to change. */
export const marker = (key: string) => `<!-- thread:${key} -->`;

/** Free text with comment delimiters stripped, so only lines written here can look like markers. */
export function clean(text: string) {
  return text.replaceAll("<!--", "").replaceAll("-->", "").trim();
}

/** The first line stands in for a title; GitHub caps at 256, so cut well short. */
export function title(body: string) {
  const line = body.split("\n")[0]!.trim();
  return line.length > 72 ? `${line.slice(0, 72)}…` : line;
}

/**
 * Labels need push access to stick, so the trailer repeats them where they can't be lost.
 * Attachments sit above the rule, so `text` keeps them for rendering.
 */
export function trailer(input: Context, sender?: Sender, files: File[] = []) {
  const lines = [
    clean(input.body),
    ...(files.length ? ["", ...files.map(link)] : []),
    "",
    "---",
    `Page: ${clean(input.page ?? "") || "-"}`,
    `Tag: ${input.tag}`,
    `Urgency: ${input.urgency ?? "medium"}`,
    ...(input.agent ? [`Browser: ${clean(input.agent)}`] : []),
    ...(input.viewport ? [`Viewport: ${clean(input.viewport)}`] : []),
    ...(input.locale ? [`Locale: ${clean(input.locale)}`] : []),
    ...(input.timezone ? [`Timezone: ${clean(input.timezone)}`] : []),
  ];
  if (!sender) return lines.join("\n");
  return [...lines, `From: ${sender.name} (${sender.email})`, "", author(sender.id)].join("\n");
}

/** Feedback proper, not a thread another feature keeps appending to. */
export function plain(body: string) {
  return !body.includes("<!-- thread:");
}

export function match(filter: Filter) {
  return (row: Row) =>
    (!filter.state || row.state === filter.state) && (!filter.tag || row.tag === filter.tag);
}

/** Labels may not stick, so tag and urgency are read back from the trailer. */
export function row(raw: Raw): Row {
  const tail = raw.body.slice(Math.max(0, raw.body.lastIndexOf(RULE)));
  return {
    id: raw.id,
    title: raw.title,
    url: raw.url,
    state: raw.state,
    tag: Tags.find((one) => one === field(tail, "Tag")) ?? "bug",
    urgency: Urgencies.find((one) => one === field(tail, "Urgency")) ?? "medium",
    from: field(tail, "From"),
    user: tail.match(/<!-- feedback \{"user":"([^"]+)"\} -->/)?.[1] ?? null,
    time: raw.time,
    updated: raw.updated,
    comments: raw.comments,
  };
}

export function detail(raw: Raw, replies: Comment[]): Detail {
  return { ...row(raw), body: raw.body, text: text(raw.body), replies };
}

// === UTILS ===

/** Hidden in the body so `mine` can find a sender's issues without trusting the visible trailer. */
function author(user: string) {
  return `<!-- feedback ${JSON.stringify({ user })} -->`;
}

/** What the sender wrote: everything above the trailer. */
function text(body: string) {
  const at = body.lastIndexOf(RULE);
  return (at < 0 ? body : body.slice(0, at)).trim();
}

/** An image shows inline wherever the body renders; anything else links. */
function link(file: File) {
  return `${file.type.startsWith("image/") ? "!" : ""}[${clean(file.name).replace(/[[\]]/g, "")}](${file.url})`;
}

function field(tail: string, name: string) {
  return tail.match(new RegExp(`^${name}: (.+)$`, "m"))?.[1]?.trim() ?? null;
}
