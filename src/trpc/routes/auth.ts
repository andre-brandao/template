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
  // login: publicProcedure
  //   .input(
  //     z.object({
  //       username: z
  //         .string()
  //         .min(3)
  //         .max(31)
  //         .regex(/^[a-z0-9_-]+$/),
  //       password: z.string().min(6).max(255),
  //     }),
  //   )
  //   .query(async ({ ctx, input }) => {
  //     const { cookies } = ctx
  //     const { username, password } = input

  //     const [existingUser] = await user.usernameExists(username)

  //     if (!existingUser) {
  //       return {
  //         error: 'Incorrect username',
  //       }
  //     }

  //     const validPassword = await verify(existingUser.password_hash, password, {
  //       memoryCost: 19456,
  //       timeCost: 2,
  //       outputLen: 32,
  //       parallelism: 1,
  //     })
  //     if (!validPassword) {
  //       return {
  //         error: 'Incorrect  password',
  //       }
  //     }

  //     const session = await lucia.createSession(existingUser.id, {})
  //     const sessionCookie = lucia.createSessionCookie(session.id)
  //     cookies.set(sessionCookie.name, sessionCookie.value, {
  //       path: '.',
  //       ...sessionCookie.attributes,
  //     })

  //     redirect(302, '/')
  //   }),

  // signup: publicProcedure
  //   .input(
  //     z.object({
  //       username: z
  //         .string()
  //         .min(3)
  //         .max(31)
  //         .regex(/^[a-z0-9_-]+$/),
  //       email: z.string().email(),
  //       password: z.string().min(6).max(255),
  //     }),
  //   )
  //   .query(async ({ ctx, input }) => {
  //     const { cookies } = ctx
  //     const { username, password, email } = input

  //     const [existingUser] = await user.usernameExists(username)

  //     if (!existingUser) {
  //       return {
  //         error: 'Incorrect username',
  //       }
  //     }

  //     const validPassword = await verify(existingUser.password_hash, password, {
  //       memoryCost: 19456,
  //       timeCost: 2,
  //       outputLen: 32,
  //       parallelism: 1,
  //     })
  //     if (!validPassword) {
  //       return {
  //         error: 'Incorrect  password',
  //       }
  //     }

  //     const passwordHash = await hash(password, {
  //       // recommended minimum parameters
  //       memoryCost: 19456,
  //       timeCost: 2,
  //       outputLen: 32,
  //       parallelism: 1,
  //     })
  //     const userId = generateId(15)

  //     try {
  //       user.insertUser({
  //         id: userId,
  //         username,
  //         email,
  //         emailVerified: false,
  //         password_hash: passwordHash,
  //       })

  //       const verificationCode = await user.generateEmailVerificationCode(
  //         userId,
  //         email,
  //       )
  //       await sendMail(email, emailTemplate.verificationCode(verificationCode))

  //       const session = await lucia.createSession(userId, {})
  //       const sessionCookie = lucia.createSessionCookie(session.id)
  //       cookies.set(sessionCookie.name, sessionCookie.value, {
  //         path: '.',
  //         ...sessionCookie.attributes,
  //       })
  //     } catch (e) {
  //       if (e instanceof LibsqlError && e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
  //         return {
  //           error: {
  //             message: 'Username already used',
  //           },
  //         }
  //       }
  //       console.error(e)
  //       return {
  //         error: 'An error occurred',
  //       }
  //     }
  //   }),

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
})
