import type { openaiCompatibleText } from "@tanstack/ai-openai/compatible";
import { Context } from "@template/core/context";
import { fromEnv } from "../config";
import { litellm } from "./litellm";

export type ModelPort = {
  list(): Promise<{ ids: string[]; default: string }>;
  text(model?: string): ReturnType<typeof openaiCompatibleText>;
};

export namespace Model {
  const port = Context.port<ModelPort>(() => litellm(fromEnv(process.env)));

  export const provide = port.provide;
  export const provider = port.provider;
  export const list = () => port.use().list();
  export const text = (model?: string) => port.use().text(model);
}

export { litellm } from "./litellm";
