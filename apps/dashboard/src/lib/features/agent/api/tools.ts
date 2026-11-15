import {
  convertSchemaToJsonSchema,
  type ChatMiddleware,
  type JSONSchema,
  type Tool,
} from "@tanstack/ai";

// Bedrock behind the LiteLLM gateway rejects these, so they never reach the model. Every
// tool input is re-validated with its real schema (core `fn`, the MCP, the browser) anyway.
const DROP = new Set([
  "minimum",
  "maximum",
  "exclusiveMinimum",
  "exclusiveMaximum",
  "multipleOf",
  "minLength",
  "maxLength",
  "minItems",
  "maxItems",
  "minProperties",
  "maxProperties",
  "pattern",
  "format",
]);

// Maps of names to subschemas: their keys are property names, not keywords.
const MAPS = new Set(["properties", "patternProperties", "$defs", "definitions"]);

function strip(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(strip);
  if (typeof node !== "object" || node === null) return node;
  return Object.fromEntries(
    Object.entries(node).flatMap(([key, value]) => {
      if (DROP.has(key)) return [];
      if (MAPS.has(key) && typeof value === "object" && value !== null)
        return [[key, Object.fromEntries(Object.entries(value).map(([k, v]) => [k, strip(v)]))]];
      return [[key, strip(value)]];
    }),
  );
}

/**
 * A tool schema the gateway accepts. The open root is not expressible in OpenAI strict mode,
 * so the adapter falls back to `strict: false` and sends it unmodified — keep that line.
 */
export function loose(schema: Parameters<typeof convertSchemaToJsonSchema>[0]): JSONSchema {
  const json = strip(convertSchemaToJsonSchema(schema) ?? {}) as JSONSchema;
  return { ...json, type: "object", additionalProperties: true };
}

/** Loosens every tool of the run, the MCP's and the browser's included. */
export const relax: ChatMiddleware = {
  name: "loose",
  onConfig: (_, config) => ({
    tools: config.tools.map((tool) => ({ ...tool, inputSchema: loose(tool.inputSchema) })),
  }),
};

export type Source = "page" | "app" | "mcp";

// A field's type on one short line: `string`, `"a" | "b"`, `number[]`.
function kind(field: JSONSchema): string {
  if (field.enum) return field.enum.map((one) => JSON.stringify(one)).join(" | ");
  if (field.const !== undefined) return JSON.stringify(field.const);
  if (field.$ref) return field.$ref.split("/").at(-1) ?? "unknown";
  const union = field.anyOf ?? field.oneOf;
  if (union) return [...new Set(union.map(kind))].join(" | ");
  if (field.type === "array") {
    const item = field.items && !Array.isArray(field.items) ? kind(field.items) : "unknown";
    return item.includes(" | ") ? `(${item})[]` : `${item}[]`;
  }
  if (Array.isArray(field.type)) return field.type.join(" | ");
  return field.type ?? "unknown";
}

/** A tool as the Tools tab lists it: its schema as the gateway gets it, a row per field. */
export function entry(source: Source, tool: Pick<Tool, "name" | "description" | "inputSchema">) {
  const schema = loose(tool.inputSchema);
  const required = new Set(schema.required ?? []);
  return {
    source,
    name: tool.name,
    description: tool.description,
    params: Object.entries(schema.properties ?? {}).map(([name, field]) => ({
      name,
      type: kind(field),
      required: required.has(name),
      description: field.description,
    })),
  };
}
