type Input = {
  method: string;
  /** Composed path and query string, exactly what the console would send. */
  url: string;
  base: string;
  /** Operation id, which is also the generated SDK method name. */
  id: string;
  token: string;
  body: string;
  /** Path and query values, keyed by param name. */
  values: Record<string, string>;
};

/** The SDK and CLI both take one flat bag: path and query params merged with the body fields. */
function bag(input: Input) {
  const filled = Object.entries(input.values).filter(([, value]) => value);
  return { ...Object.fromEntries(filled), ...parse(input.body) };
}

function parse(body: string) {
  if (!body.trim()) return {};
  try {
    return JSON.parse(body) as Record<string, unknown>;
  } catch {
    return {};
  }
}

const quote = (text: string) => `'${text.replaceAll("'", `'\\''`)}'`;

export function curl(input: Input) {
  const lines = [`curl -X ${input.method} ${quote(input.base + input.url)}`];
  if (input.token) lines.push(`-H 'authorization: Bearer ${input.token}'`);
  if (input.body) lines.push(`-H 'content-type: application/json'`, `-d ${quote(input.body)}`);
  return lines.join(" \\\n  ");
}

export function fetch(input: Input) {
  const headers = [
    input.token && `    authorization: "Bearer ${input.token}",`,
    input.body && `    "content-type": "application/json",`,
  ].filter(Boolean);
  const init = [
    `  method: ${JSON.stringify(input.method)},`,
    headers.length && `  headers: {\n${headers.join("\n")}\n  },`,
    input.body && `  body: JSON.stringify(${pad(input.body)}),`,
  ].filter(Boolean);
  return `const res = await fetch(${JSON.stringify(input.base + input.url)}, {
${init.join("\n")}
});
const data = await res.json();`;
}

/** Indents every line but the first, so a JSON blob sits right inside the snippet. */
const pad = (text: string) => text.replaceAll("\n", "\n  ");

export function sdk(input: Input) {
  const args = Object.entries(bag(input))
    .map(([name, value]) => `  ${name}: ${JSON.stringify(value)},`)
    .join("\n");
  const auth = input.token
    ? JSON.stringify(`Bearer ${input.token}`)
    : "`Bearer ${process.env.TEMPLATE_TOKEN}`";
  return `import { TemplateSdk } from "@template/sdk";
import { createClient } from "@template/sdk/client";

const sdk = new TemplateSdk({
  client: createClient({
    baseUrl: ${JSON.stringify(input.base)},
    headers: { authorization: ${auth} },
  }),
});

const { data, error } = await sdk.${input.id}(${args ? `{\n${args}\n}` : ""});`;
}

export function cli(input: Input) {
  const head = `bun cli api ${input.id} --url ${input.base}${input.token ? ` --token ${input.token}` : ""}`;
  // A body has to go as one JSON blob — the CLI stops reading flags once it sees `{`.
  if (input.body) return `${head} ${quote(JSON.stringify(bag(input)))}`;
  return Object.entries(bag(input)).reduce(
    (line, [name, value]) => `${line} --${name} ${quote(String(value))}`,
    head,
  );
}
