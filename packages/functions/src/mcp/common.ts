import type { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Meta } from "@template/core/util/fn";

/** Wraps data as an MCP text result — every tool returns through this. */
export function text(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

type Op<S extends z.ZodType> = ((input: z.infer<S>) => unknown) & { meta: Meta; schema: S };

/**
 * Registers tools against one server. Title, description and input schema all come off the
 * core op, so a tool can never document itself differently from the route over the same op.
 * `run` is only needed when the tool reports something other than the op's own return.
 */
export function tools(server: McpServer) {
  const tool = <S extends z.ZodObject<z.ZodRawShape>>(
    name: string,
    op: Op<S>,
    run?: (input: z.infer<S>) => unknown,
  ) =>
    server.registerTool(name, { ...op.meta, inputSchema: op.schema.shape }, async (input) =>
      text(await (run ?? op)(input as z.infer<S>)),
    );

  /** Ops keyed by a bare id, whose schema is a string rather than an object to spread. */
  tool.id = (
    name: string,
    op: ((id: string) => unknown) & { meta: Meta; schema: z.ZodString },
    run?: (id: string) => unknown,
  ) => {
    const shape: z.ZodRawShape = { id: op.schema };
    return server.registerTool(name, { ...op.meta, inputSchema: shape }, async (input) =>
      text(await (run ?? op)(input.id as string)),
    );
  };

  return tool;
}
