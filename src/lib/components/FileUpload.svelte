<script lang="ts">
  import { toast } from 'svelte-sonner'

  interface FileUploadProps {
    id?: string
    size?: number
    class?: string
    onFileChange?: (file: File, previewUrl: string, resizedBlob: Blob) => void
  }

  let {
    id,
    size: maxSize = 400,
    class: className = 'file-input w-full input-bordered file-input-sm ',
    onFileChange = (f, p, b) => {},
  }: FileUploadProps = $props()

  let file: File | null = $state(null)
  let previewUrl: string | null = $state(null)
  let isPreviewOpen = $state(false)
  let resizedBlob: Blob | null = $state(null)

  function handleAccept() {
    if (!file || !previewUrl || !resizedBlob) return
    onFileChange(file, previewUrl, resizedBlob)
    isPreviewOpen = false
  }
  function handleCancel() {
    isPreviewOpen = false
    file = null
  }

  const resizeAndFormatImage = (
    file: File,
  ): Promise<{ url: string; blob: Blob }> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const reader = new FileReader()

      reader.onload = e => {
        img.src = e.target?.result as string
      }

      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          reject(new Error('Canvas context not available'))
          return
        }

        let width = img.width
        let height = img.height
        let offsetX = 0
        let offsetY = 0

        // Calculate the aspect ratio and dimensions
        const aspectRatio = width / height

        if (aspectRatio > 1) {
          // Landscape orientation: crop width
          height = maxSize
          width = height * aspectRatio
          offsetX = (width - maxSize) / 2
        } else {
          // Portrait orientation: crop height
          width = maxSize
          height = width / aspectRatio
          offsetY = (height - maxSize) / 2
        }

        canvas.width = maxSize
        canvas.height = maxSize

        // Draw the image on the canvas, cropping the excess parts
        ctx.drawImage(img, -offsetX, -offsetY, width, height)

        // Convert the canvas to a Blob and Data URL
        canvas.toBlob(blob => {
          if (blob) {
            const resizedImageUrl = canvas.toDataURL('image/jpeg') // You can change the format to 'image/png' or 'image/webp'
            resolve({ url: resizedImageUrl, blob })
          } else {
            reject(new Error('Failed to create blob from canvas'))
          }
        }, 'image/jpeg') // You can change the format to 'image/png' or 'image/webp'
      }

      img.onerror = err => {
        reject(new Error('Failed to load image'))
      }

      reader.onerror = err => {
        reject(new Error('Failed to read file'))
      }

      reader.readAsDataURL(file)
    })
  }

  const handleFileChange = async (event: Event) => {
    const input = event.target as HTMLInputElement
    if (input.files && input.files[0]) {
      file = input.files[0]
      try {
        const { url, blob } = await resizeAndFormatImage(file)
        previewUrl = url
        resizedBlob = blob
        isPreviewOpen = true
      } catch (error) {
        console.error('Error resizing image:', error)
        if (error instanceof Error) {
          toast.error(error.message)
        } else {
          toast.error('Error resizing image')
        }
      }
    }
  }
</script>

<input
  {id}
  type="file"
  class={className}
  accept="image/*"
  onchange={handleFileChange}
/>

<div class="drawer drawer-end">
  <input
    id="my-drawer"
    bind:checked={isPreviewOpen}
    type="checkbox"
    class="drawer-toggle"
  />
  <div class="drawer-side z-40">
    <label for="my-drawer" aria-label="close sidebar" class="drawer-overlay"
    ></label>
    <ul class="menu min-h-full w-80 bg-base-200 p-4 text-base-content">
      {#if previewUrl}
        <!-- svelte-ignore a11y_img_redundant_alt -->
        <img src={previewUrl} alt="Image preview" class="rounded" />
        <div class="mx-5 mt-5 flex justify-between">
          <button class="btn bg-green-200" onclick={handleAccept}>
            Accept
          </button>
          <button class="btn bg-red-200" onclick={handleCancel}>
            Cancel
          </button>
        </div>
      {/if}
    </ul>
  </div>
</div>

<style>
</style>
