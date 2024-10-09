// file initialized by the Paraglide-SvelteKit CLI - Feel free to edit it
import { i18n } from '$lib/i18n/i18n'

// export const reroute = i18n.reroute()


import { getDomainAndType } from "$lib/utils";
import type { Reroute } from "@sveltejs/kit";


export const reroute: Reroute = ({ url }) => {

    const i18nPathname = i18n.reroute()({url})

  const domain = getDomainAndType(url.host);
  if (domain.type === "appDomain") {
    return i18nPathname;
  } else {
    const tenantDomain = domain.domain;
    return `/tenant/${tenantDomain}${i18nPathname}`;
  }
};
