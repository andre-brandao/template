<script lang="ts">
  import type { PageData } from './$types'
  import FileUpload from '$lib/components/FileUpload.svelte'

  export let data: PageData
</script>

<div class="flex flex-col">
  <FileUpload
    onFileChange={(file, previewUrl, resizedBlob) => {
      console.log(previewUrl, resizedBlob)
    }}
  ></FileUpload>
</div>
