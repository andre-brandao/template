import { publicProcedure, router } from '../t'

import { z } from 'zod'

import { user } from '$db/controller'
import { lucia } from '$lib/server/auth'
import { redirect } from '@sveltejs/kit'
// import { hash, verify } from '@node-rs/argon2'

// import { generateId } from 'lucia'
// import { LibsqlError } from '@libsql/client'

import { emailTemplate, sendMail } from '$lib/server/email'

export const auth = router({
  logOut: publicProcedure.query(async ({ ctx }) => {
    const { cookies } = ctx
    const { session } = ctx.locals
    if (!session) {
      return {
        error: 'Not authenticated',
      }
    }
    await lucia.invalidateSession(session.id)
    const sessionCookie = lucia.createBlankSessionCookie()
    cookies.set(sessionCookie.name, sessionCookie.value, {
      path: '.',
      ...sessionCookie.attributes,
    })

    return redirect(302, '/login')
  }),

  resendEmailVerification: publicProcedure.query(async ({ ctx }) => {
    const { locals } = ctx

    const localUser = locals.user

    if (!localUser) {
      return {
        message: 'Not authenticated',
      }
    }

    const verificationCode = await user.generateEmailVerificationCode(
      localUser.id,
      localUser.email,
    )
    await sendMail(
      localUser.email,
      emailTemplate.verificationCode(verificationCode),
    )

    return {
      message: 'Verification email sent',
    }
  }),

  verifyEmail: publicProcedure
    .input(
      z.object({
        code: z.string().length(8),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { cookies, locals } = ctx
      const sessionId = locals.session?.id
      const { code } = input

      if (!sessionId) {
        return {
          error: 'Not authenticated',
          data: null,
        }
      }

      const { user: lucia_user } = await lucia.validateSession(sessionId)
      if (!lucia_user) {
        return {
          error: 'Not authenticated',
          data: null,
        }
      }

      const validCode = await user.verifyVerificationCode(lucia_user, code)

      if (!validCode) {
        return {
          error: 'Invalid code',
          data: null,
        }
      }

      await lucia.invalidateUserSessions(lucia_user.id)
      await user.updateUser(lucia_user.id, {
        emailVerified: true,
      })

      const session = await lucia.createSession(lucia_user.id, {})
      const sessionCookie = lucia.createSessionCookie(session.id)
      cookies.set(sessionCookie.name, sessionCookie.value, {
        path: '.',
        ...sessionCookie.attributes,
      })

      return {
        data: {
          message: 'Email verified',
          success: true,
        },
        error: null,
      }
    }),
  resetPassword: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input, ctx }) => {
      const { email } = input
      const { url } = ctx

      // const user = await db.table('user').where('email', '=', email).get()
      const [{ id: userID }] = await user.emailExists(email)
      if (!userID) {
        // If you want to avoid disclosing valid emails,
        // this can be a normal 200 response.
        return {
          error: 'Invalid email',
          data: null,
        }
      }

      const verificationToken = await user.createPasswordResetToken(userID)
      // const verificationLink =
      //   'http://localhost:3000/reset-password/' + verificationToken
      const verificationLink = `${url.origin}/reset-password/${verificationToken}`

      // await sendPasswordResetToken(email, verificationLink)
      await sendMail(email, emailTemplate.resetPassword(verificationLink))
      return {
        data: 'Password reset email sent, Check your email',
        error: null,
      }
    }),
})
