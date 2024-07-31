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
    const response = await fetch('/api/image', {
      method: 'POST',
      body: formData,
    })

    if (response.ok) {
      const data = await response.json()
      return { data: Number(data.img_id) }
    } else {
      console.error(response.statusText)

      if (response.statusText === 'Unauthorized') {
        return { error: 'Unauthorized' }
      }
      return { error: 'Error uploading image' }
    }
  } catch (error) {
    console.error(error)
    return { error: 'Error uploading image' }
  }
}

export function getImagePath(id?: number | string | null) {
  if (!id) {
    return 'https://placehold.co/400x400?text=Upload+Image'
  }
  return `/api/image/${id}`
}
