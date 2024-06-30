import type { RequestHandler } from './$types'

import { db } from '$lib/server/db'
import { imageTable } from '$lib/server/db/schema'
import { eq } from 'drizzle-orm'

import sharp from 'sharp'

export const GET: RequestHandler = async ({ params }) => {
  const id = Number(params.id)

  if (!id) {
    return new Response('Not found', { status: 404 })
  }

  const [{ img }] = await db
    .select({
      img: imageTable.data,
    })
    .from(imageTable)
    .where(eq(imageTable.id, id))
    .limit(1)

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
  const { user } = locals

  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const formData = await request.formData()
    const name = formData.get('name')
    const image = formData.get('image')

    if (typeof name !== 'string' || !(image instanceof File)) {
      return new Response('Invalid form data', { status: 400 })
    }

    const imageBuffer = Buffer.from(await image.arrayBuffer())

    const processedImage = await sharp(imageBuffer)
      .resize({ width: 400, height: 400, fit: 'cover' })
      .toBuffer()

    const [{ img_id }] = await db
      .insert(imageTable)
      .values({
        name,
        data: processedImage,
        uploaded_by: user.id,
      })
      .returning({
        img_id: imageTable.id,
      })

    return new Response(JSON.stringify({ img_id }), {
      status: 200,
    })
  } catch (error) {
    console.error('Error creating image: ', error)
    return new Response('Error creating image', { status: 500 })
  }
}
