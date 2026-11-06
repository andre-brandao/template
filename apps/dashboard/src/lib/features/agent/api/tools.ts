import { convertSchemaToJsonSchema, type ChatMiddleware, type JSONSchema } from "@tanstack/ai";

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
