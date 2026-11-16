import type { Handle } from "@sveltejs/kit/hooks";
import { Workspaces } from "@template/core/workspaces";

// Multi mode picks the workspace by `workspace` cookie or `x-workspace` slug. Runs after `auth`.
export const tenancy: Handle = ({ event, resolve }) =>
  Workspaces.enter(
    event.cookies.get("workspace") ?? event.request.headers.get("x-workspace") ?? undefined,
    () => resolve(event),
  );
