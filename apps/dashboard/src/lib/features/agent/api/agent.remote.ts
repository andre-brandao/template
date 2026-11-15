import { z } from "zod";
import { Conversation } from "@template/core/conversation";
import { remote } from "$lib/server/remote";
import { Agent } from "./core";

export const getModels = remote.query(z.void(), () => Agent.models());

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
