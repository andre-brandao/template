import { describe, expect, it } from "bun:test";
import type { ModelMessage } from "@tanstack/ai";
import { z } from "zod";
import { Agent } from "../src/lib/features/agent/api/core";
import { Sql } from "../src/lib/features/agent/api/copilot/sql";
import { loose } from "../src/lib/features/agent/api/tools";
import { transcript } from "../src/lib/features/agent/transcript";
import * as ask from "../src/lib/features/agent/ask/catalog";
import { forwarded } from "../src/lib/features/agent/api/serve";
import { bars, formatter, metric, numeric } from "../src/lib/features/agent/panel/numbers";

// Never reaches an LLM, the MCP or a database: the pure parts of the agent.
const call = (name: string) => ({
  id: `call_${name}`,
  type: "function" as const,
  function: { name, arguments: "{}" },
});

describe("Agent.tail", () => {
  it("keeps what follows the last assistant message", () => {
    const messages: ModelMessage[] = [
      { role: "user", content: "hi" },
      { role: "assistant", content: "hello" },
      { role: "user", content: "which projects?" },
    ];
    expect(Agent.tail(messages)).toEqual([{ role: "user", content: "which projects?" }]);
  });

  it("keeps the browser's tool results after a tool call", () => {
    const messages: ModelMessage[] = [
      { role: "user", content: "refresh" },
      { role: "assistant", content: null, toolCalls: [call("refresh")] },
      { role: "tool", content: "ok", toolCallId: "call_refresh" },
    ];
    expect(Agent.tail(messages).map((message) => message.role)).toEqual(["tool"]);
  });
});

describe("Agent.entry", () => {
  it("joins the text parts and names the tools called", () => {
    const message: ModelMessage = {
      role: "assistant",
      content: [
        { type: "text", content: "Two " },
        { type: "text", content: "projects." },
      ],
      toolCalls: [call("project_list"), call("todo_list")],
    };
    const entry = Agent.entry(message);
    expect(entry.text).toBe("Two projects.");
    expect(entry.tools).toEqual(["project_list", "todo_list"]);
    expect(entry.content).toBe(message);
  });

  it("has no text for a bare tool call", () => {
    expect(
      Agent.entry({ role: "assistant", content: null, toolCalls: [call("todo_list")] }).text,
    ).toBeNull();
  });
});

describe("loose", () => {
  it("drops the keywords the gateway rejects and opens the root", () => {
    const schema = loose(
      z.object({
        format: z.string().min(1).max(10),
        size: z.number().int().min(1).max(5),
        tags: z.array(z.string()).max(3),
      }),
    );
    expect(schema.additionalProperties).toBe(true);
    // `format` is a property here, not the keyword: it stays.
    expect(Object.keys(schema.properties ?? {})).toEqual(["format", "size", "tags"]);
    const text = JSON.stringify(schema);
    for (const word of ["minLength", "maxLength", "minimum", "maximum", "maxItems"])
      expect(text).not.toContain(`"${word}"`);
  });
});

describe("Sql.relations", () => {
  it("collects every scanned relation from an explain plan", () => {
    const plan = [
      {
        Plan: {
          "Node Type": "Hash Join",
          Plans: [
            { "Relation Name": "todo", Schema: "public" },
            { Plans: [{ "Relation Name": "key", Schema: "public" }] },
          ],
        },
      },
    ];
    expect(Sql.relations(plan)).toEqual([
      { schema: "public", name: "todo" },
      { schema: "public", name: "key" },
    ]);
  });

  it("maps only queryable tables to resources that have read", () => {
    expect(Object.keys(Sql.Tables)).not.toContain("key");
    expect(Object.keys(Sql.Tables)).not.toContain("conversation");
  });
});

describe("transcript", () => {
  it("drops a tool result whose call is missing", () => {
    const messages = transcript([
      { content: { role: "user", content: "hi" } },
      { content: { role: "tool", content: "orphan", toolCallId: "call_gone" } },
      { content: { role: "assistant", content: "hello" } },
    ]);
    expect(messages.map((message) => message.role)).toEqual(["user", "assistant"]);
  });
});

describe("ask", () => {
  const spec = {
    root: "f",
    elements: {
      f: {
        type: "Form",
        props: { title: "T", description: null, submit: null },
        children: ["c", "n"],
      },
      c: {
        type: "Choice",
        props: {
          name: "period",
          label: "Period",
          hint: null,
          reason: null,
          options: [
            { value: "week", label: "This week", description: null },
            { value: "month", label: "This month", description: null },
          ],
          recommended: "week",
        },
        children: [],
      },
      n: {
        type: "TextField",
        props: {
          name: "note",
          label: "Note",
          hint: null,
          reason: null,
          default: null,
          placeholder: null,
          multiline: false,
          required: false,
        },
        children: [],
      },
    },
  };

  it("reads answers back in words and flags kept suggestions", () => {
    const out = ask.output(spec, { period: "week", note: null });
    expect(out.answers).toEqual([
      { name: "period", label: "Period", answer: "This week", value: "week", recommended: true },
      { name: "note", label: "Note", answer: "—", value: null, recommended: false },
    ]);
  });

  it("flags duplicate field names", () => {
    const dupe = {
      ...spec,
      elements: {
        ...spec.elements,
        n: { ...spec.elements.n, props: { ...spec.elements.n.props, name: "period" } },
      },
    };
    expect(ask.verify(dupe).some((one) => one.error.includes("duplicate"))).toBe(true);
  });
});

describe("forwarded", () => {
  it("keeps a known model, the browser's thread and the page as a prompt", () => {
    const opts = forwarded(
      {
        model: "b",
        thread: "t-1",
        page: { url: "/todos", title: "Todos", crumbs: ["Home", "Todos"] },
      },
      "fallback",
      ["a", "b"],
    );
    expect(opts.thread).toBe("t-1");
    expect(opts.model).toBe("b");
    expect(opts.prompts[0]).toContain('"Todos" (/todos), trail: Home › Todos');
  });

  it("falls back on anything malformed", () => {
    const opts = forwarded({ model: "zzz", thread: "x".repeat(300), page: { url: 1 } }, "fb", [
      "a",
    ]);
    expect(opts).toEqual({ thread: "fb", model: undefined, prompts: [] });
    expect(forwarded(undefined, "fb", []).thread).toBe("fb");
  });
});

describe("panel numbers", () => {
  const data = {
    columns: [
      { name: "status", type: "text" },
      { name: "total", type: "bigint" },
    ],
    rows: [
      { status: "done", total: "4" },
      { status: "active", total: 2 },
    ],
  };

  it("reads a metric from the named or first numeric column", () => {
    expect(metric(data)).toBe(4);
    expect(metric(data, "status")).toBeUndefined();
    expect(metric({ columns: [], rows: [] })).toBeUndefined();
    expect(numeric({ type: "numeric" })).toBe(true);
  });

  it("sizes bars against the largest value", () => {
    expect(bars(data)).toEqual([
      { label: "done", value: 4, width: 100 },
      { label: "active", value: 2, width: 50 },
    ]);
    expect(bars({ columns: [{ name: "s", type: "text" }], rows: [] })).toBeUndefined();
  });

  it("formats numbers and percents", () => {
    expect(formatter("percent")(12.345)).toBe("12.35%");
    expect(formatter(null)(1234)).toBe("1,234");
  });
});

describe("Agent.attach", () => {
  it("runs offline without an MCP client", () => {
    expect(Agent.attach(undefined)).toEqual({ mcp: undefined, prompts: [Agent.offline] });
  });
});
