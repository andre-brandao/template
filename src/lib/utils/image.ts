export async function uploadImage(image: File, name: string) {
  const formData = new FormData()
  formData.append('name', name)
  formData.append('image', image)

  try {
    const resp = await fetch('/api/image', {
      method: 'POST',
      body: formData,
    })

    if (resp.status === 200) {
      const { img_id } = await resp.json()
      return { img_id, error: null }
    }
    return { error: await resp.text(), img_id: null }
  } catch (error) {
    console.error(error)
    return { error: 'Error uploading image', img_id: null }
  }
}

export function getImagePath(id?: number | null) {
  return `/api/image/${id}`
}
