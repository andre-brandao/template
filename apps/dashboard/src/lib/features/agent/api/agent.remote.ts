import { z } from "zod";
import { Conversation } from "@template/core/conversation";
import { remote } from "$lib/server/remote";
import { Delegation } from "@template/core/auth/delegation";
import { Agent } from "./core";
import { listing } from "./orchestrator/agent";

export const getModels = remote.query(z.void(), () => Agent.models());

/** The app and MCP tools the orchestrator calls, as the caller; the page ones live in the browser. */
export const getTools = remote.query(z.void(), async () =>
  listing(await Delegation.create({ name: "orchestrator" })),
);

/** The caller's own orchestrator conversations, most recent first, by page. */
export const getConversations = remote
  .core(Conversation.list)
  .with(
    z
      .number()
      .int()
      .min(1)
      .transform((page) => ({ agent: "orchestrator", page })),
  )
  .query();

export const getConversation = remote.core(Conversation.fromID).query();

export const removeConversation = remote.core(Conversation.remove).command();
