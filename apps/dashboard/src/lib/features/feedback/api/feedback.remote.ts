import { Feedback } from "./feedback";
import { remote } from "$lib/server/remote";

export const send = remote(Feedback.create).form();
