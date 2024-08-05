<script lang="ts">
  import { uploadImage, getImagePath } from '$utils'
  import { toast } from 'svelte-sonner'

  export let name = 'PlaceholderName'
  export let image_id: number | null
  export let save: (image_id: number) => void

  let image: File | null = null
  let responseMessage = ''

  const handleFileChange = (
    event: Event & {
      currentTarget: EventTarget & HTMLInputElement
    },
  ) => {
    const files = (event.target as HTMLInputElement).files
    if (files && files.length > 0) {
      image = files[0]
    }

    if (image) {
      handleSubmit()
    }
  }

  const handleSubmit = async () => {
    if (!image) {
      return
    }

    const { data, error } = await uploadImage(image, name)
    console.log(data)
    console.log(error)

    if (!data) {
      responseMessage = error ?? 'Error Uploading'
    } else {
      image_id = data
      toast.info('Image Uploaded')
      save(data)
    }
  }

  let input: HTMLInputElement
  const triggerFileInput = () => {
    input?.click()
  }
</script>

<div class="image-container object-cover">
  <img width="100" height="100" src={getImagePath(image_id)} alt="" class="rounded-lg" />

  <input
    id="file-input"
    type="file"
    accept="image/*"
    class="upload-input"
    bind:this={input}
    on:change={handleFileChange}
  />

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <span class="upload-icon" on:click={triggerFileInput}>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="lucide lucide-image-up"
    >
      <path
        d="M10.3 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10l-3.1-3.1a2 2 0 0 0-2.814.014L6 21"
      />
      <path d="m14 19.5 3-3 3 3" />
      <path d="M17 22v-5.5" />
      <circle cx="9" cy="9" r="2" />
    </svg>
  </span>
</div>

{#if responseMessage}
  <p class="bg-error p-1">
    {responseMessage}
  </p>
{/if}

<style>
  .image-container {
    position: relative;
    display: inline-block;
  }

  .image-container img {
    display: block;
  }

  .upload-input {
    display: none;
  }

  .upload-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    cursor: pointer;
    color: white;
    background: rgba(0, 0, 0, 0.5);
    padding: 10px;
    border-radius: 50%;
    display: none;
  }

  .image-container:hover .upload-icon {
    display: block;
  }
</style>
