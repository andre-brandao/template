import { app } from "@template/functions/api";
import { spec } from "@template/functions/api/spec";

type Schema = {
  type?: string;
  enum?: unknown[];
  anyOf?: Schema[];
  items?: Schema;
  properties?: Record<string, Schema>;
};

type Op = {
  operationId?: string;
  tags?: string[];
  summary?: string;
  description?: string;
  parameters?: { name: string; in: string; required?: boolean; schema?: Schema }[];
  requestBody?: { content?: Record<string, { schema?: Schema }> };
};

const stub: Record<string, unknown> = { integer: 0, number: 0, boolean: false };

/** A stand-in value for a schema, so a request body arrives filled in rather than blank. */
function sample(schema: Schema): unknown {
  const one = schema.anyOf?.find((next) => next.type !== "null") ?? schema;
  if (one.enum) return one.enum[0];
  if (one.type === "array") return one.items ? [sample(one.items)] : [];
  if (one.type === "object") return fields(one);
  return stub[String(one.type)] ?? "";
}

function fields(schema: Schema) {
  return Object.fromEntries(
    Object.entries(schema.properties ?? {}).map(([name, next]) => [name, sample(next)]),
  );
}

function params(op: Op) {
  return (op.parameters ?? []).map((one) => ({
    name: one.name,
    in: one.in,
    required: one.required ?? false,
    options: one.schema?.enum?.map(String) ?? null,
  }));
}

/** The request body's media type, and a prefilled example when it is JSON. */
function payload(op: Op) {
  const content = op.requestBody?.content ?? {};
  const mime = Object.keys(content).at(0) ?? "";
  const schema = content[mime]?.schema;
  return {
    mime,
    body: schema && mime === "application/json" ? JSON.stringify(sample(schema), null, 2) : "",
  };
}

/** Every operation the api serves, read from the live routes rather than the checked-in spec. */
export async function ops() {
  const doc = await spec();
  const paths = doc.paths as Record<string, Record<string, Op>>;
  const list = Object.entries(paths).flatMap(([path, methods]) =>
    Object.entries(methods).map(([method, op]) => ({
      id: op.operationId ?? method + path,
      tag: op.tags?.at(0) ?? "Other",
      method: method.toUpperCase(),
      path,
      summary: op.summary ?? "",
      description: op.description ?? "",
      params: params(op),
      ...payload(op),
    })),
  );
  return { base: doc.servers?.at(0)?.url ?? "", list };
}

/**
 * Runs a request against the Hono app in-process, so it needs no listening api service and no
 * CORS. Auth is the real thing: an `sk-` key resolves through the same middleware.
 */
export async function call(input: { method: string; path: string; token: string; body: string }) {
  const body = input.method === "GET" ? "" : input.body;
  const at = performance.now();
  const res = await app.fetch(
    new Request(new URL(input.path, "http://api.internal"), {
      method: input.method,
      headers: {
        ...(input.token ? { authorization: `Bearer ${input.token}` } : {}),
        ...(body ? { "content-type": "application/json" } : {}),
      },
      body: body || undefined,
    }),
  );
  const text = await res.clone().text();
  return {
    status: res.status,
    ms: Math.round(performance.now() - at),
    headers: Object.fromEntries(res.headers),
    // Pretty-printed here so the console renders the body as-is.
    text: await res
      .json()
      .then((json) => JSON.stringify(json, null, 2))
      .catch(() => text),
  };
}
