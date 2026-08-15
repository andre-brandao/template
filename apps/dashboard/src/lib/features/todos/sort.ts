import type { Todo } from "@template/core/todo";
import { sorted } from "$lib/utils/sort";

/** Mirrored from core, type-only — `satisfies` fails the build if a key is renamed there. */
type Key = NonNullable<Parameters<typeof Todo.list>[0]["sort"]>[number];

export const sort = sorted([
  "title",
  "status",
  "stage",
  "assignee",
  "startDate",
  "dueDate",
  "timeCreated",
] as const satisfies readonly Exclude<Key, `-${string}`>[]);
