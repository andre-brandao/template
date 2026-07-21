import { form, query } from "$app/server";
import { redirect } from "@sveltejs/kit";
import { z } from "zod";
import { Organization } from "@template/core/organization";
import { auth, guard } from "$lib/server/remote";

export const getOrgs = query(async () => {
  auth();
  return Organization.list();
});

export const createOrg = form(z.object({ name: Organization.Info.shape.name }), async (input) => {
  auth();
  const id = await guard(() => Organization.create({ name: input.name }));
  redirect(303, `/${id}/todos`);
});

export const renameOrg = form(z.object({ name: Organization.Info.shape.name }), async (input) => {
  auth();
  await guard(() => Organization.update({ name: input.name }));
  await getOrgs().refresh();
});
