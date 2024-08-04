import type { RequestHandler } from './$types'

import { env } from '$env/dynamic/private'
import { json } from '@sveltejs/kit'

export const GET: RequestHandler = async () => {
  return json({ data: env.VAPID_PUBLIC_KEY })
}
