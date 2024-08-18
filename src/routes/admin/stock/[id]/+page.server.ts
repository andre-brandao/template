import type { PageServerLoad } from './$types'
import { product } from '$db/controller'
import { error } from '@sveltejs/kit'
export const load = (async ({ params }) => {
  const itemID = Number(params.id)
  const item_info = await product.getProductItemByID(itemID)

  if(!item_info){
    return error(404, 'Item not found')
  }
  return {
    item_info,
  }
}) satisfies PageServerLoad
