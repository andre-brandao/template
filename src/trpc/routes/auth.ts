import { publicProcedure, router } from '../t'

import { z } from 'zod'

import { usernameExists } from '$queries'
import { lucia } from '$lib/server/auth'
import { redirect } from '@sveltejs/kit'
import { hash, verify } from '@node-rs/argon2'
import { insertUser } from '$lib/server/db/schema/user'
import { generateId } from 'lucia'
import { LibsqlError } from '@libsql/client'

export const auth = router({
  login: publicProcedure
    .input(
      z.object({
        username: z
          .string()
          .min(3)
          .max(31)
          .regex(/^[a-z0-9_-]+$/),
        password: z.string().min(6).max(255),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { cookies } = ctx.event
      const { username, password } = input

      const [existingUser] = await usernameExists(username)

      if (!existingUser) {
        return {
          error: 'Incorrect username',
        }
      }

      const validPassword = await verify(existingUser.password_hash, password, {
        memoryCost: 19456,
        timeCost: 2,
        outputLen: 32,
        parallelism: 1,
      })
      if (!validPassword) {
        return {
          error: 'Incorrect  password',
        }
      }

      const session = await lucia.createSession(existingUser.id, {})
      const sessionCookie = lucia.createSessionCookie(session.id)
      cookies.set(sessionCookie.name, sessionCookie.value, {
        path: '.',
        ...sessionCookie.attributes,
      })

      redirect(302, '/')
    }),

  signup: publicProcedure
    .input(
      z.object({
        username: z
          .string()
          .min(3)
          .max(31)
          .regex(/^[a-z0-9_-]+$/),
        password: z.string().min(6).max(255),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { cookies } = ctx.event
      const { username, password } = input

      const [existingUser] = await usernameExists(username)

      if (!existingUser) {
        return {
          error: 'Incorrect username',
        }
      }

      const validPassword = await verify(existingUser.password_hash, password, {
        memoryCost: 19456,
        timeCost: 2,
        outputLen: 32,
        parallelism: 1,
      })
      if (!validPassword) {
        return {
          error: 'Incorrect  password',
        }
      }

      const passwordHash = await hash(password, {
        // recommended minimum parameters
        memoryCost: 19456,
        timeCost: 2,
        outputLen: 32,
        parallelism: 1,
      })
      const userId = generateId(15)

      try {
        insertUser({
          id: userId,
          username,
          password_hash: passwordHash,
        })

        const session = await lucia.createSession(userId, {})
        const sessionCookie = lucia.createSessionCookie(session.id)
        cookies.set(sessionCookie.name, sessionCookie.value, {
          path: '.',
          ...sessionCookie.attributes,
        })
      } catch (e) {
        if (e instanceof LibsqlError && e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
          return {
            error: {
              message: 'Username already used',
            },
          }
        }
        console.error(e)
        return {
          error: 'An error occurred',
        }
      }
    }),

  logOut: publicProcedure.query(async ({ ctx }) => {
    const { cookies } = ctx.event
    const { session } = ctx
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
})
