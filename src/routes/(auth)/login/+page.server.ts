// import { lucia } from '$lib/server/auth'
import { fail, redirect } from '@sveltejs/kit'
// import { verify } from '@node-rs/argon2'

import type { Actions, PageServerLoad } from './$types'

import { user } from '$db/controller'
import { emailTemplate, sendMail } from '$lib/server/email'

export const load: PageServerLoad = async event => {
  if (event.locals.user) {
    return redirect(302, '/')
  }
  return {}
}

export const actions: Actions = {
  default: async ({ request, url }) => {
    const formData = await request.formData()

    const email = formData.get('email')

    if (
      typeof email !== 'string' ||
      email.length < 3 ||
      email.length > 255 ||
      !/.+@.+/.test(email)
    ) {
      return fail(400, {
        success: false,
        message: 'Invalid email',
      })
    }

    const [existingUser] = await user.getUserByEmail(email)

    if (!existingUser) {
      return fail(400, {
        success: false,
        message: 'User not found',
      })
    }

    try {
      const verificationToken = await user.createMagicLinkToken(
        existingUser.id,
        existingUser.email,
      )
      const verificationLink = `${url.origin}/login/${verificationToken}`
      await sendMail(email, emailTemplate.magicLink(verificationLink))
    } catch (error) {
      console.error(error)
      return fail(500, {
        success: false,
        message: 'Failed to send magic link',
      })
    }
    return {
      message: 'Magic link sent, Check your email',
      success: true,
    }
  },
}
