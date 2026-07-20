import { Insights } from "@template/core/todo";
import { remote } from "$lib/server/remote";

export const getStats = remote(Insights.stats).query();
export const getStatus = remote(Insights.status).query();
export const getDue = remote(Insights.due).query();
export const getActivity = remote(Insights.activity).query();
export const getCalendar = remote(Insights.calendar).query();
