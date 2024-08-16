import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
// import { bugReport } from '$lib/server/db/controller'
export const load = (async () => {
  // await bugReport.
  // TODO: insert cancel log
  return redirect(303, '/checkout')
}) satisfies PageServerLoad
