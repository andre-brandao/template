import { error } from "@sveltejs/kit";
import { Template } from "@template/core/email/template";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = ({ params }) => {
  const one = Template._list.find((mail) => mail.name === params.name);
  if (!one) error(404, `No template named ${params.name}`);
  return { mail: one.render() };
};
