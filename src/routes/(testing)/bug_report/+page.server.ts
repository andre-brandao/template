import { bugReport } from '$lib/server/db/controller'
import type { PageServerLoad } from './$types'

export const load = (async () => {
  try {
    const bugs = await bugReport.getBugReports()
    return { bugs }
  } catch (e) {
    console.error(e)
    return { bugs: [] }
  }
}) satisfies PageServerLoad
