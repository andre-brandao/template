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

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { name, image } = await request.json()

    const imageBuffer = Buffer.from(image, 'base64')

    const processedImage = await sharp(imageBuffer)
      .resize({ width: 400, fit: 'cover' }) // Resize the image
      .toBuffer()

    const [{ img_id }] = await db
      .insert(imageTable)
      .values({
        name,
        data: processedImage,
      })
      .returning({
        img_id: imageTable.id,
      })

    return new Response(JSON.stringify({ img_id }), {
      status: 201,
    })
  } catch (error) {
    console.error('Error creating image: ', error)
    return new Response('Error creating image', { status: 500 })
  }
}
