import { fail, redirect } from '@sveltejs/kit'

import type { Actions, PageServerLoad } from './$types'

import { user } from '$db/controller'
import { sessionsC } from '$lib/server/auth/sessions'
import {
  deleteSessionTokenCookie,
  setSessionTokenCookie,
} from '$lib/server/auth/cookies'
import { emailTemplate, sendMail } from '$lib/server/services/email'
// import { emailTemplate, sendMail } from '$lib/server/email'

export const load: PageServerLoad = async event => {
  if (event.locals.user) {
    return redirect(302, '/')
  }
  return {}
}

export const actions: Actions = {
  magic_link: async ({ request, url }) => {
    const formData = await request.formData()
    
    const email = formData.get('email')
    console.log('(auth)/login?/magic_link', email)

    const { error } = await user.auth.login.magicLink.send({
      email,
      url,
    })

    if (error) {
      return fail(404, {
        success: false,
        message: error.message,
      })
    }

    return {
      success: true,
      message: 'Magic link sent, Check your email',
    }
  },
  logout: async event => {
    console.log('(auth)/login?/logout', event.locals.user)
    const { session } = event.locals

    if (!session) {
      return redirect(302, '/login')
    }
    await sessionsC.invalidateSession(session.id)
    deleteSessionTokenCookie(event)
    return redirect(302, '/login')
  },

  password: async event => {
    const formData = await event.request.formData()
    // const username = formData.get('username')
    const password = formData.get('password')
    const email = formData.get('email')
    console.log('(auth)/login?/password', email, password)

    const { data, error } = await user.auth.login.password(email, password)

    if (error) {
      return fail(404, {
        succes: false,
        message: error.message,
      })
    }
    const existingUser = data.user

    const token = sessionsC.generateSessionToken()
    const session = await sessionsC.createSession(token, existingUser.id)
    setSessionTokenCookie(event, token, session.expiresAt)
    if (!existingUser.emailVerified) {
      return redirect(302, '/verify-email')
    }

    return redirect(302, '/')
  },

  signup: async event => {
    const formData = await event.request.formData()
    const username = formData.get('username')
    const password = formData.get('password')
    const email = formData.get('email')
    console.log('(auth)/login?/signup', username, email, password)
    
    const { data, error } = await user.auth.register.withPassword(
      username,
      email,
      password,
    )

    if (error) {
      return fail(400, {
        success: false,
        message: error.message,
        username,
        email,
      })
    }

    const userId = data.user.id
    const ueserEmail = data.user.email

    const token = sessionsC.generateSessionToken()
    const session = await sessionsC.createSession(token, userId)
    setSessionTokenCookie(event, token, session.expiresAt)

    // const verificationCode = await user.verificationCode.generate(
    //   userId,
    //   ueserEmail,
    // )

    // await sendMail(ueserEmail, emailTemplate.verificationCode(verificationCode))

    return redirect(302, '/admin')
  },
}
