// Client-safe copy of Permission.all from @template/core/organization/permission —
// core pulls in node-only modules, so the browser bundle keeps its own list.
export const permissions = [
  "todo:read",
  "todo:write",
  "file:read",
  "file:write",
  "member:read",
  "member:manage",
  "role:manage",
  "invite:manage",
  "org:manage",
] as const;
