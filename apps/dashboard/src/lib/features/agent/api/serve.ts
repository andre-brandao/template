import { chatParamsFromRequestBody, toServerSentEventsResponse } from "@tanstack/ai";
import { error, type RequestEvent } from "@sveltejs/kit";
import { z } from "zod";
import { Identity } from "@template/core/identity";
import { Delegation } from "@template/core/auth/delegation";
import { agents } from "./agents";
import { Agent } from "./core";

/** What the browser forwards with each message: model and page. */
const Props = z.object({
  model: z.string().optional().catch(undefined),
  page: z
    .object({
      url: z.string().max(2000),
      title: z.string().max(200),
      crumbs: z.array(z.string().max(200)).max(10),
    })
    .optional()
    .catch(undefined),
});

/** The forwarded props as run options: a known model, the page as a prompt. */
export function forwarded(raw: unknown, models: string[]) {
  const props = Props.catch({}).parse(raw ?? {});
  const page = props.page;
  return {
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
 * The SSE endpoint, behind the dashboard session. MCP calls carry a delegation, so they run as
 * the `orchestrator` agent for the signed-in user; in-process tools run as the user.
 */
export async function serve(event: RequestEvent) {
  if (Identity.use().type !== "user") error(401, "Authentication required");
  const body = await event.request.json().catch(() => error(400, "Invalid JSON"));
  const params = await chatParamsFromRequestBody(body);
  // The browser's conversation id keys the recorded thread, whose column is capped.
  if (params.threadId.length > 255) error(400, "Invalid threadId");
  const opts = forwarded(params.forwardedProps, (await Agent.models()).ids);
  const abortController = new AbortController();
  const stream = await agents.orchestrator({
    ...opts,
    threadId: params.threadId,
    runId: params.runId,
    messages: params.messages,
    // A delegation, not the session: the MCP sees "orchestrator for this user", and the events it
    // causes say so. Expires on its own, so a leaked one outlives nothing.
    token: await Delegation.create({ name: "orchestrator" }),
    tools: params.tools,
    abortController,
  });
  return toServerSentEventsResponse(stream, { abortController });
}
