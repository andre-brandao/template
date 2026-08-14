import type { Story } from "@template/ui/story";

/** Values that would not read well inline become a `{name}` shorthand the reader defines. */
function attr(name: string, value: unknown) {
  if (value === false || value === undefined || value === null || value === "") return [];
  if (value === true) return [name];
  if (typeof value === "number") return [`${name}={${value}}`];
  if (typeof value === "string" && !value.includes("\n") && value.length < 48)
    return [`${name}=${JSON.stringify(value)}`];
  return [`{${name}}`];
}

export function snippet(story: Story, props: Record<string, unknown>) {
  const tag = story.title;
  const list = Object.entries({ ...story.base, ...props }).flatMap(([name, value]) =>
    attr(name, value),
  );
  const close = story.slot ? `>${story.slot}</${tag}>` : " />";
  const flat = `<${tag}${list.map((one) => ` ${one}`).join("")}${close}`;
  const body =
    flat.length <= 76
      ? flat
      : `<${tag}\n${list.map((one) => `  ${one}\n`).join("")}${close.trimStart()}`;
  return `<script lang="ts">
  import { ${tag} } from "@template/ui";
</script>

${body}`;
}

/** The story file minus its module block and styles — what is left is the demo usage. */
export const markup = (src: string) =>
  src
    .replace(/<script module[\s\S]*?<\/script>/, "")
    .replace(/<style>[\s\S]*?<\/style>/, "")
    .trim();
