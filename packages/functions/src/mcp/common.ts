/** Wraps data as an MCP text result — every tool returns through this. */
export function text(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}
