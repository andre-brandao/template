import { Feedback } from "@template/core/feedback";
import { remote } from "#lib/server/gate.ts";

export const getTally = remote.core(Feedback.Experiment.tally).query();
export const vote = remote.core(Feedback.Experiment.vote).command();
export const expose = remote.core(Feedback.Experiment.expose).command();
