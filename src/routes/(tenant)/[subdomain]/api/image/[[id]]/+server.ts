import type { RequestHandler } from './$types'

import { imageC } from '$db/tenant/controller'

export const GET: RequestHandler = async ({ params, locals }) => {
  const id = Number(params.id)
  const { tenantDb } = locals
  if (!id || !tenantDb) {
    return new Response('Not found', { status: 404 })
  }

  const [{ img }] = await imageC(tenantDb).getImageByID(id)

  if (!img) {
    return new Response('Not found', { status: 404 })
  }
  // get image
  return new Response(img, {
    headers: {
      'Content-Type': 'image/jpeg',
    },
  })
}

export const POST: RequestHandler = async ({ request, locals }) => {
  const { user, tenantDb } = locals

  if (!user || !tenantDb) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const formData = await request.formData()
    const name = formData.get('name')
    const imageFile = formData.get('image')

    if (typeof name !== 'string' || !(imageFile instanceof File)) {
      return new Response('Invalid form data', { status: 400 })
    }

    const imageBuffer = Buffer.from(await imageFile.arrayBuffer())

    const [{ img_id }] = await imageC(tenantDb).insertImage({
      buff: imageBuffer,
      name,
      uploaded_by: user.id,
    })
    return new Response(JSON.stringify({ img_id }), {
      status: 200,
    })
  } catch (error) {
    console.error('Error creating image: ', error)
    return new Response('Error creating image', { status: 500 })
  }
}
