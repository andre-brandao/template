import { Google } from 'arctic'
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from '$env/static/private'
import { PUBLIC_DOMAIN } from '$env/static/public'
import { dev } from '$app/environment'

export const google = new Google(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  `${dev ? 'http' : 'https'}://${PUBLIC_DOMAIN}/login/google/callback`,
)
