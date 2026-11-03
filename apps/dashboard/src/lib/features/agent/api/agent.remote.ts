import { z } from "zod";
import { remote } from "$lib/server/remote";
import { Agent } from "./core";
import { Conversation } from "./conversation";

export const getModels = remote.query(z.void(), () => Agent.models());

/** The caller's own copilot conversations, most recent first, by page. */
export const getConversations = remote
  .core(Conversation.list)
  .with(
    z
      .number()
      .int()
      .min(1)
      .optional()
      .transform((page) => ({ agent: "copilot", page: page ?? 1 })),
  )
  .query();

export const getConversation = remote.core(Conversation.fromID).query();

export const removeConversation = remote.command(z.uuid(), async (id) => {
  await Conversation.remove(id);
  await getConversations().refresh();
});
