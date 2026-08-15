import type { Event } from "@template/core/event";
import type { User } from "@template/core/user";
import { sorted } from "$lib/utils/sort";

/** Mirrored from core, type-only — `satisfies` fails the build if a key is renamed there. */
type UserKey = NonNullable<Parameters<typeof User.page>[0]["sort"]>[number];
type EventKey = NonNullable<Parameters<typeof Event.list>[0]["sort"]>[number];

export const users = sorted([
  "name",
  "email",
  "role",
  "timeCreated",
] as const satisfies readonly Exclude<UserKey, `-${string}`>[]);

export const events = sorted([
  "type",
  "source",
  "user",
  "timeCreated",
] as const satisfies readonly Exclude<EventKey, `-${string}`>[]);
