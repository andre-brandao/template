import { Insights } from "@template/core/todo";
import { remote } from "$lib/server/remote";

export const getStats = remote.core(Insights.stats).query();
export const getStatus = remote.core(Insights.status).query();
export const getLoad = remote.core(Insights.load).query();
export const getDue = remote.core(Insights.due).query();
export const getActivity = remote.core(Insights.activity).query();
export const getCalendar = remote.core(Insights.calendar).query();
