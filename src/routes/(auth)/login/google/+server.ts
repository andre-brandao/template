import type { RequestHandler } from './$types'

import { generateState, generateCodeVerifier, Google } from 'arctic'

import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from '$env/static/private'

export const GET: RequestHandler = async event => {
  const state = generateState()
  const codeVerifier = generateCodeVerifier()

  const url = new Google(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    event.url.origin + '/login/google/callback',
  ).createAuthorizationURL(state, codeVerifier, ['openid', 'profile'])

  event.cookies.set('google_oauth_state', state, {
    path: '/',
    httpOnly: true,
    maxAge: 60 * 10, // 10 minutes
    sameSite: 'lax',
  })
  event.cookies.set('google_code_verifier', codeVerifier, {
    path: '/',
    httpOnly: true,
    maxAge: 60 * 10, // 10 minutes
    sameSite: 'lax',
  })

  return new Response(null, {
    status: 302,
    headers: {
      Location: url.toString(),
    },
  })
}
