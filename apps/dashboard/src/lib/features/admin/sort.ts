import type { Admin } from "@template/core/admin";
import type { Event } from "@template/core/event";
import { sorted } from "#lib/utils/sort.ts";

/** Mirrored from core, type-only — `satisfies` fails the build if a key is renamed there. */
type UserKey = NonNullable<Parameters<typeof Admin.users>[0]["sort"]>[number];
type EventKey = NonNullable<Parameters<typeof Event.list>[0]["sort"]>[number];

export const keys = {
  users: sorted(["name", "email", "role", "timeCreated"] as const satisfies readonly Exclude<
    UserKey,
    `-${string}`
  >[]),
  events: sorted(["type", "source", "user", "timeCreated"] as const satisfies readonly Exclude<
    EventKey,
    `-${string}`
  >[]),
};
