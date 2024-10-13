import { publicProcedure, router } from '$trpc/t'

import { z } from 'zod'

import { userC, userC as userController } from '$db/tenant/controller'

import { emailTemplate, sendMail } from '$lib/server/services/email'
import { setSessionTokenCookie } from '$lib/server/auth/cookies'

export const userRouter = router({
  resendEmailVerification: publicProcedure.query(async ({ ctx }) => {
    const { locals } = ctx

    const localUser = locals.user
    if (!localUser) {
      return {
        message: 'Not authenticated',
      }
    }

    const verificationCode = await userC(
      ctx.tenantDb,
    ).verificationCode.generate(localUser.id, localUser.email)

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
      const { locals, lucia } = ctx
      const sessionId = locals.session?.id
      const { code } = input

      if (!sessionId) {
        return {
          error: 'Not authenticated',
          data: null,
        }
      }

      const { user } = await lucia.validateSessionToken(sessionId)
      if (!user) {
        return {
          error: 'Not authenticated',
          data: null,
        }
      }

      const validCode = await userController(
        ctx.tenantDb,
      ).verificationCode.verify(user, code)

      if (!validCode) {
        return {
          error: 'Invalid code',
          data: null,
        }
      }

      await lucia.invalidateUserSessions(user.id)
      await userController(ctx.tenantDb).update(user.id, {
        emailVerified: true,
      })
      const token = lucia.generateSessionToken()
      const session = await lucia.createSession(token, user.id)
      setSessionTokenCookie(ctx, token, session.expiresAt)

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
      const [{ id: userID }] = await userController(ctx.tenantDb).getByEmail(
        email,
      )
      if (!userID) {
        // If you want to avoid disclosing valid emails,
        // this can be a normal 200 response.
        return {
          error: 'Invalid email',
          data: null,
        }
      }

      const verificationToken = await userController(
        ctx.tenantDb,
      ).passwordRecovery.createToken(userID)
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
