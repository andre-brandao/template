import { orchestrator } from "./orchestrator/agent";
import { panel } from "./panel/agent";

/** Adding an agent: a folder `<name>/agent.ts` and a line here. */
export const agents = { orchestrator, panel };
