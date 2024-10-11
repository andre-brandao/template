import type { RequestHandler } from './$types'
import {
  generateSessionToken,
  createSession,
  setSessionTokenCookie,
} from '$lib/server/auth'
// import { google } from '$lib/server/oauth'

import { user } from '$db/controller'

import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from '$env/static/private'

import { Google, decodeIdToken, type OAuth2Tokens } from 'arctic'

export const GET: RequestHandler = async event => {
  const { url } = event

  const code = event.url.searchParams.get('code')
  const state = event.url.searchParams.get('state')

  const storedState = event.cookies.get('google_oauth_state') ?? null
  const codeVerifier = event.cookies.get('google_code_verifier') ?? null
  if (
    code === null ||
    state === null ||
    storedState === null ||
    codeVerifier === null
  ) {
    return new Response(null, {
      status: 400,
    })
  }
  if (state !== storedState) {
    return new Response(null, {
      status: 400,
    })
  }

  let tokens: OAuth2Tokens
  try {
    tokens = await new Google(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      url.origin + '/login/google/callback',
    ).validateAuthorizationCode(code, codeVerifier)
  } catch (e) {
    console.error(e)
    // Invalid code or client credentials
    return new Response(null, {
      status: 400,
    })
  }
  const claims = decodeIdToken(tokens.idToken())
  console.log('claims')
  console.log(claims)

  // @ts-expect-error claims is not null
  const googleUserId = claims.sub
  // @ts-expect-error claims is not null
  const username = claims.name
  // @ts-expect-error claims is not null
  const email = claims.email

  const existingUser = await user.getUserFromAuthProvider(
    'google',
    googleUserId,
  )

  if (existingUser !== null) {
    const sessionToken = generateSessionToken()
    const session = await createSession(sessionToken, existingUser.id)
    setSessionTokenCookie(event, sessionToken, session.expiresAt)
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/',
      },
    })
  }

  const [newUser] = await user
    .create({
      email,
      username,
      emailVerified: true,
    })
    .returning()

  await user.auth.register.authProvider({
    code: googleUserId,
    provider: 'google',
    userId: newUser.id,
    meta_data: claims,
  })

  const sessionToken = generateSessionToken()
  const session = await createSession(sessionToken, newUser.id)
  setSessionTokenCookie(event, sessionToken, session.expiresAt)
  return new Response(null, {
    status: 302,
    headers: {
      Location: '/',
    },
  })
}
