type Input = {
  method: string;
  /** Composed path and query string, exactly what the console would send. */
  url: string;
  /** The route template, `/todo/{id}`: its slots say which values are path params. */
  path: string;
  base: string;
  /** Operation id, which is also the generated SDK method name. */
  id: string;
  token: string;
  body: string;
  /** Path and query values, keyed by param name. */
  values: Record<string, string>;
};

/** The SDK and CLI both take `{ path, query, body }`, minus the empty groups. */
function groups(input: Input) {
  const filled = Object.entries(input.values).filter(([, value]) => value);
  const slot = (name: string) => input.path.includes(`{${name}}`);
  const all = {
    path: Object.fromEntries(filled.filter(([name]) => slot(name))),
    query: Object.fromEntries(filled.filter(([name]) => !slot(name))),
    body: parse(input.body),
  };
  return Object.entries(all).filter(([, group]) => Object.keys(group).length);
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
  const args = groups(input)
    .map(([name, group]) => `\n  ${name}: ${pad(JSON.stringify(group, null, 2))},`)
    .join("");
  const auth = input.token
    ? JSON.stringify(`Bearer ${input.token}`)
    : "`Bearer ${process.env.TEMPLATE_TOKEN}`";
  // `sdk.gen`, not the barrel: the barrel also pulls in the optional TanStack peer.
  return `import { ${input.id} } from "@template/sdk/sdk.gen";
import { createClient } from "@template/sdk/client";

const client = createClient({
  baseUrl: ${JSON.stringify(input.base)},
  headers: { authorization: ${auth} },
});

const { data, error } = await ${input.id}({\n  client,${args}\n});`;
}

export function cli(input: Input) {
  const head = `bun cli api ${input.id} --url ${input.base}${input.token ? ` --token ${input.token}` : ""}`;
  // A body has to go as one JSON blob — the CLI stops reading flags once it sees `{`.
  if (input.body) return `${head} ${quote(JSON.stringify(Object.fromEntries(groups(input))))}`;
  return groups(input)
    .flatMap(([name, group]) =>
      Object.entries(group).map(([key, value]) => ` --${name}.${key} ${quote(String(value))}`),
    )
    .reduce((line, flag) => line + flag, head);
}
