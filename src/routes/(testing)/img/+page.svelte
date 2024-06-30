<script>
  import { onMount } from 'svelte'

  import { uploadImage } from '$lib/utils/image'

  let name = ''
  /**
   * @type {File | null}
   */
  let image = null
  let responseMessage = ''

  const handleFileChange = event => {
    const files = event.target.files
    if (files.length > 0) {
      image = files[0]
    }
  }

  const handleSubmit = async event => {
    event.preventDefault()
    if (!image) {
      return
    }

    const { img_id, error } = await uploadImage(image, name)

    console.log( error)

    if (error) {
      responseMessage = error
    } else {
      responseMessage = img_id
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
        on:change={handleFileChange}
        required
      />
    </div>
    <button type="submit">Upload</button>
  </form>
  {#if responseMessage}
    <p>{responseMessage}</p>
  {/if}
</main>

<img src="/api/image/{responseMessage}" alt="" />

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
