import axios from 'axios'

/**
 * POSTs an image to the server /api/image
 * The server will save the image and return the image id
 *
 * returns {data: number} if successful
 *
 * @param image {File}
 * @param name {string}
 * @returns {Promise<{data: number} | {error: string}>}
 */
export async function uploadImage(image: File, name: string) {
  const formData = new FormData()
  formData.append('name', name)
  formData.append('image', image)

  try {
    const { data } = await axios.post('/api/image', formData)

    return { data: Number(data.img_id) }
  } catch (error) {
    console.error(error)
    return { error: 'Error uploading image' }
  }
}

export function getImagePath(id?: number | string | null) {
  return `/api/image/${id}`
}
