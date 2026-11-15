import { chatParamsFromRequestBody, toServerSentEventsResponse } from "@tanstack/ai";
import { error, type RequestEvent } from "@sveltejs/kit";
import { z } from "zod";
import { Actor } from "@template/core/actor";
import { token } from "$lib/server/session";
import { agents } from "./agents";
import { Agent } from "./core";

/** What the browser forwards with each message: model, thread and page. */
const Props = z.object({
  model: z.string().optional().catch(undefined),
  // Kept by the browser so a page tool's follow-up request lands in the same conversation.
  thread: z.string().min(1).max(255).optional().catch(undefined),
  page: z
    .object({
      url: z.string().max(2000),
      title: z.string().max(200),
      crumbs: z.array(z.string().max(200)).max(10),
    })
    .optional()
    .catch(undefined),
});

/** The forwarded props as run options: a known model, the thread, the page as a prompt. */
export function forwarded(raw: unknown, fallback: string, models: string[]) {
  const props = Props.catch({}).parse(raw ?? {});
  const page = props.page;
  return {
    thread: props.thread ?? fallback,
    model: models.find((id) => id === props.model),
    prompts: page
      ? [
          `The user is on the page "${page.title}" (${page.url}), trail: ${page.crumbs.join(" › ")}.
"Here", "this project", "this todo" and the like refer to it; ids in the URL identify the record.`,
        ]
      : [],
  };
}

/**
 * The SSE endpoint, behind the dashboard session. The session cookie is also the bearer the
 * MCP accepts, so every server tool call runs as the signed-in user.
 */
export async function serve(event: RequestEvent) {
  const session = token(event);
  if (Actor.use().type !== "user" || !session) error(401, "Authentication required");
  const body = await event.request.json().catch(() => error(400, "Invalid JSON"));
  const params = await chatParamsFromRequestBody(body);
  const opts = forwarded(params.forwardedProps, params.threadId, (await Agent.models()).ids);
  const abortController = new AbortController();
  const stream = await agents.copilot({
    ...opts,
    threadId: params.threadId,
    runId: params.runId,
    messages: params.messages,
    token: session,
    tools: params.tools,
    abortController,
  });
  return toServerSentEventsResponse(stream, { abortController });
}
