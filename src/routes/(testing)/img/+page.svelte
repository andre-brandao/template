<script lang="ts">
  import { onMount } from 'svelte'

  import { getImagePath, uploadImage } from '$lib/utils/image'

  let name = ''

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
  }

  const handleSubmit = async (event:Event) => {
    event.preventDefault()
    if (!image) {
      return
    }

    const { data, error } = await uploadImage(image, name)
    console.log(data)

    console.log(error)

    if (error) {
      responseMessage = error
    } else {
      responseMessage = `${data}`
    }
  }
</script>

<main>
  <h1>Upload Image</h1>
  <form on:submit={handleSubmit}>
    <div>
      <label for="name">Name:</label>
      <input id="name" type="text" bind:value={name} required />
    </div>
    <div>
      <label for="image">Image:</label>
      <input
        id="image"
        type="file"
        accept="image/*"
        on:change={e => handleFileChange(e)}
        required
      />
    </div>
    <button type="submit">Upload</button>
  </form>
  {#if responseMessage}
    <p>{responseMessage}</p>
  {/if}
</main>

<img src={getImagePath(responseMessage)} alt="" />

<style>
  main {
    max-width: 600px;
    margin: 0 auto;
    padding: 1rem;
  }

  div {
    margin-bottom: 1rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
  }

  input[type='text'],
  input[type='file'] {
    width: 100%;
  }

  button {
    display: block;
    margin-top: 1rem;
  }
</style>
