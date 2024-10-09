import type { PageServerLoad, Actions } from './$types'

import { createTenant } from '$lib/server/db/central/constroller'
import { fail } from '@sveltejs/kit'

export const load = (async () => {
  return {}
}) satisfies PageServerLoad

export const actions: Actions = {
  create_tenant: async ({ request }) => {
    const formData = await request.formData()
    const tenantName = formData.get('tenantName')
    const subdomain = formData.get('subdomain')
    const username = formData.get('username')
    const email = formData.get('email')
    const password = formData.get('password')
    const confirmPassword = formData.get('confirmPassword')

    if (password !== confirmPassword) {
      return fail(400, {
        success: false,
        message: 'Passwords do not match',
        form: {
          email,
          subdomain,
          tenantName,
          username,
        },
      })
    }
    const result = await createTenant({
      email,
      password,
      subdomain,
      tenantName,
      username,
    })

    if (!result.success || !result.data) {
      return fail(400, {
        success: false,
        message: result.message,
        form: {
          email,
          subdomain,
          tenantName,
          username,
        },
      })
    }

    return {
      success: true,
      message: 'Tenant created',
      data: result.data,
    }
  },
}
