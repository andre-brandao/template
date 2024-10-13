import type { RequestEvent } from '@sveltejs/kit'

export function setSessionTokenCookie(
  event: RequestEvent,
  token: string,
  expiresAt: Date,
  cookieName = 'session',
): void {
  event.cookies.set(cookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  })
}

export function deleteSessionTokenCookie(
  event: RequestEvent,
  cookieName = 'session',
): void {
  event.cookies.set(cookieName, '', {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
}
