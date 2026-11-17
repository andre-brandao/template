import { z } from "zod";
import { Model } from "@template/agent";
import { Conversation } from "@template/core/conversation";
import { remote } from "#lib/server/gate.ts";

export const getModels = remote.query(z.void(), () => Model.list());

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
