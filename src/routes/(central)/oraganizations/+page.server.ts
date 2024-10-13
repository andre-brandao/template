import type { PageServerLoad } from './$types'

import { tenants } from '$db/central/schema'
import { centralDb } from '$lib/server/db/central'
import { redirect } from '@sveltejs/kit'
// import { redirect } from '@sveltejs/kit'

export const load = (async () => {
  // const { tenantInfo } = locals

  // if (tenantInfo) {
  //   return redirect(303, `/${tenantInfo.subdomain}`)
  // }

  try {
    const tenantsData = await centralDb
      .select({
        name: tenants.name,
        subdomain: tenants.subdomain,
      })
      .from(tenants)

    console.log(tenantsData)
    return {
      tenantsData,
    }
  } catch (err) {
    console.error(err)
    return redirect(303, '/')
  }
}) satisfies PageServerLoad
