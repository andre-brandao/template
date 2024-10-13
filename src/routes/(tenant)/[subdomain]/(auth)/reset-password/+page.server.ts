import { error, fail } from '@sveltejs/kit'
import type { PageServerLoad, Actions } from './$types'
import { userC } from '$db/tenant/controller'
import { emailTemplate, sendMail } from '$lib/server/services/email'

export const load = (async () => {
  return {}
}) satisfies PageServerLoad

export const actions: Actions = {
  default: async ({ request, url, locals }) => {
    const { tenantDb } = locals

    if (!tenantDb) {
      error(404, 'Tenant not found')
    }

    const formData = await request.formData()

    const email = formData.get('email')

    if (
      typeof email !== 'string' ||
      email.length < 3 ||
      email.length > 255 ||
      !/.+@.+/.test(email)
    ) {
      return fail(400, {
        message: 'Invalid email',
      })
    }

    const [existingUser] = await userC(tenantDb).getByEmail(email)

    if (!existingUser) {
      return fail(400, {
        message: 'User not found',
      })
    }

    const verificationToken = await userC(
      tenantDb,
    ).passwordRecovery.createToken(existingUser.id)
    // const verificationLink =
    //   'http://localhost:3000/reset-password/' + verificationToken
    const verificationLink = `${url.origin}/reset-password/${verificationToken}`

    // await sendPasswordResetToken(email, verificationLink)
    await sendMail(email, emailTemplate.resetPassword(verificationLink))
    return {
      success: true,
      message: 'Password reset link sent, check your email',
    }
  },
}
