import { app } from "@template/functions/api";
import { spec } from "@template/functions/api/spec";

type Schema = {
  $ref?: string;
  type?: string;
  format?: string;
  enum?: unknown[];
  anyOf?: Schema[];
  items?: Schema;
  properties?: Record<string, Schema>;
  required?: string[];
  description?: string;
  example?: unknown;
  examples?: unknown[];
  default?: unknown;
  minimum?: number;
  maximum?: number;
  maxLength?: number;
  maxItems?: number;
};

type Refs = Record<string, Schema>;

type Op = {
  operationId?: string;
  tags?: string[];
  summary?: string;
  description?: string;
  parameters?: {
    name: string;
    in: string;
    required?: boolean;
    description?: string;
    schema?: Schema;
  }[];
  requestBody?: { content?: Record<string, { schema?: Schema }> };
  responses?: Record<
    string,
    { description?: string; content?: Record<string, { schema?: Schema; example?: unknown }> }
  >;
};

type Node = {
  name: string;
  type: string;
  required: boolean;
  nullable: boolean;
  description: string;
  example: string;
  options: string[] | null;
  note: string;
  children: Node[];
};

const stub: Record<string, unknown> = { integer: 0, number: 0, boolean: false };

/** The meaningful branch of a nullable `anyOf`, which is how optionals land in the doc. */
const pick = (schema: Schema) => schema.anyOf?.find((next) => next.type !== "null") ?? schema;

/** The named component a schema points at, drilling through arrays. Empty when inline. */
function ident(schema: Schema): string {
  const one = pick(schema);
  if (one.$ref) return one.$ref.split("/").at(-1) ?? "";
  return one.items ? ident(one.items) : "";
}

const deref = (schema: Schema, refs: Refs) => (schema.$ref ? (refs[ident(schema)] ?? {}) : schema);

/** The object a schema describes: `$ref` followed, nullable unwrapped, arrays drilled into. */
function shape(schema: Schema, refs: Refs): Schema {
  const one = deref(pick(schema), refs);
  return one.type === "array" && one.items ? shape(one.items, refs) : one;
}

function label(schema: Schema): string {
  if (schema.type === "array") return `${label(pick(schema.items ?? {}))}[]`;
  if (schema.$ref) return ident(schema);
  if (schema.enum) return "enum";
  return schema.type ?? "object";
}

function range(schema: Schema) {
  if (schema.minimum !== undefined && schema.maximum !== undefined)
    return `${schema.minimum}–${schema.maximum}`;
  if (schema.minimum !== undefined) return `≥${schema.minimum}`;
  if (schema.maximum !== undefined) return `≤${schema.maximum}`;
  return "";
}

/** The constraints worth showing beside a field, like `≤2000 chars`. */
function note(schema: Schema) {
  return [
    schema.format,
    range(schema),
    schema.maxLength === undefined ? "" : `≤${schema.maxLength} chars`,
    schema.maxItems === undefined ? "" : `≤${schema.maxItems} items`,
  ]
    .filter(Boolean)
    .join(" · ");
}

const show = (value: unknown) =>
  value === undefined ? "" : typeof value === "string" ? value : JSON.stringify(value);

const choices = (schema: Schema) =>
  (schema.enum ?? pick(schema.items ?? {}).enum)?.map(String) ?? null;

/** A render-ready field list for a schema, so the console can document what it sends and gets back. */
function tree(schema: Schema, refs: Refs, seen: string[] = []): Node[] {
  const root = shape(schema, refs);
  return Object.entries(root.properties ?? {}).map(([name, prop]) => {
    const one = pick(prop);
    const ref = ident(one);
    return {
      name,
      type: label(one),
      required: root.required?.includes(name) ?? false,
      nullable: prop.anyOf?.some((next) => next.type === "null") ?? false,
      description: prop.description ?? one.description ?? "",
      example: show(one.example ?? one.examples?.at(0) ?? one.default),
      options: choices(one),
      note: note(one),
      // A ref already on the stack renders as its bare name, so a cyclic model can't unroll forever.
      children: seen.includes(ref) ? [] : tree(one, refs, ref ? [...seen, ref] : seen),
    };
  });
}

/** A stand-in value for a schema, so a request body arrives filled in rather than blank. */
function sample(schema: Schema, refs: Refs): unknown {
  const one = deref(pick(schema), refs);
  if (one.enum) return one.enum[0];
  if (one.type === "array") return one.items ? [sample(one.items, refs)] : [];
  if (one.type === "object") return fields(one, refs);
  return stub[String(one.type)] ?? "";
}

function fields(schema: Schema, refs: Refs) {
  return Object.fromEntries(
    Object.entries(schema.properties ?? {}).map(([name, next]) => [name, sample(next, refs)]),
  );
}

function params(op: Op) {
  return (op.parameters ?? []).map((one) => {
    const schema = pick(one.schema ?? {});
    return {
      name: one.name,
      in: one.in,
      required: one.required ?? false,
      description: one.description ?? schema.description ?? "",
      type: label(schema),
      note: note(schema),
      example: show(schema.example ?? schema.examples?.at(0) ?? schema.default),
      options: choices(schema),
    };
  });
}

/** The request body's media type, its documented fields, and a prefilled example when it is JSON. */
function payload(op: Op, refs: Refs) {
  const content = op.requestBody?.content ?? {};
  const mime = Object.keys(content).at(0) ?? "";
  const schema = content[mime]?.schema;
  return {
    mime,
    fields: schema ? tree(schema, refs) : [],
    body:
      schema && mime === "application/json" ? JSON.stringify(sample(schema, refs), null, 2) : "",
  };
}

/** Every documented response, with its schema flattened and its example pretty-printed. */
function responses(op: Op, refs: Refs) {
  return Object.entries(op.responses ?? {})
    .map(([status, res]) => {
      const one = res.content?.[Object.keys(res.content ?? {}).at(0) ?? ""];
      return {
        status: Number(status),
        description: res.description ?? "",
        ref: ident(one?.schema ?? {}),
        type: one?.schema ? label(pick(one.schema)) : "",
        fields: one?.schema ? tree(one.schema, refs) : [],
        example: one?.example === undefined ? "" : JSON.stringify(one.example, null, 2),
      };
    })
    .sort((a, b) => a.status - b.status);
}

/** Every operation the api serves, read from the live routes rather than the checked-in spec. */
export async function ops() {
  const doc = await spec();
  const refs = (doc.components?.schemas ?? {}) as Refs;
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
      responses: responses(op, refs),
      ...payload(op, refs),
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
