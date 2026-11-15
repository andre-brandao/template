import { Todo } from "@template/core/todo";
import { remote } from "$lib/server/remote";

// Picker options shaped in SQL; no API route, so the dashboard is the only reader.
export const getLabels = remote.core(Todo.labels).query();
