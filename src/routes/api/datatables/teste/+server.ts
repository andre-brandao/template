/* eslint-disable @typescript-eslint/no-unused-vars */
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url }) => {
  // fetch dummy user json
  const response = await fetch(
    'https://jsonplaceholder.typicode.com/users',
  ).then(res => res.json())

  console.log(response)

  const pageNumber = Number(url.searchParams.get('_page'))
  const limit = Number(url.searchParams.get('_limit'))
  const offset = (pageNumber - 1) * limit
  const sort = url.searchParams.get('_sort') ?? null
  const order = url.searchParams.get('_order') ?? null
  const search = url.searchParams.get('_search') ?? null

  return json(response)
}
