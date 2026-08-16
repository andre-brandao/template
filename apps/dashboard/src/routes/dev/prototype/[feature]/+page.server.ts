import { error } from "@sveltejs/kit";
import { docs, read, safe } from "../docs";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, url }) => {
  if (!safe(params.feature)) error(404, "Not found");
  const names = await docs(params.feature);
  if (!names.length) error(404, "Not found");
  // A doc carried over from another feature falls back rather than 404s.
  const doc = names.find((one) => one === url.searchParams.get("doc")) ?? names[0];
  return { docs: names, doc, text: await read(params.feature, `${doc}.md`).text() };
};
