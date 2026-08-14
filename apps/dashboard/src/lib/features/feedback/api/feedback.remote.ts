import { Feedback } from "./feedback";
import { remote } from "$lib/server/remote";

export const send = remote.form(Feedback.create.schema, Feedback.create);
