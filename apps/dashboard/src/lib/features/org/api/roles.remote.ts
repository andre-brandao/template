import { form, query } from "$app/server";
import { z } from "zod";
import { Role } from "@template/core/organization/role";
import { Permission } from "@template/core/organization/permission";
import { auth, guard } from "$lib/server/remote";

/** Checkbox groups arrive as string | string[] | undefined depending on how many are ticked. */
const picks = z
  .union([Permission.Info, Permission.Info.array()])
  .optional()
  .transform((v) => (v == null ? [] : typeof v === "string" ? [v] : v));

export const getRoles = query(async () => {
  auth();
  return Role.list();
});

export const createRole = form(
  z.object({ name: Role.Info.shape.name, permissions: picks }),
  async (input) => {
    auth();
    await guard(() => Role.create(input));
    await getRoles().refresh();
  },
);

export const updateRole = form(
  z.object({ id: Role.Info.shape.id, name: Role.Info.shape.name, permissions: picks }),
  async (input) => {
    auth();
    await guard(() => Role.update(input));
    await getRoles().refresh();
  },
);

export const removeRole = form(z.object({ id: Role.Info.shape.id }), async (input) => {
  auth();
  await guard(() => Role.remove(input.id));
  await getRoles().refresh();
});
