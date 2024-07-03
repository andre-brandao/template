<script lang="ts">
  import type { PageData } from './$types'
  import { user } from '$lib/stores/user'
  import FileUploader from '$lib/components/FileUpload.svelte'
  import { applyAction, enhance } from '$app/forms'
  import { goto } from '$app/navigation'

  export let data: PageData

  let user_form = {
    username: $user?.username ?? '',
    profile_pic: null,
  }
</script>

<form
  class="bg-card text-card-foreground mx-auto w-full max-w-md rounded-lg border shadow-sm"
  use:enhance={({ formElement, formData, action, cancel, submitter }) => {
    // `formElement` is this `<form>` element
    // `formData` is its `FormData` object that's about to be submitted
    // `action` is the URL to which the form is posted
    // calling `cancel()` will prevent the submission
    // `submitter` is the `HTMLElement` that caused the form to be submitted

    return async ({ result, update }) => {
      // `result` is an `ActionResult` object
      // `update` is a function which triggers the default logic that would be triggered if this callback wasn't set

      // `result` is an `ActionResult` object
      if (result.type === 'redirect') {
        goto(result.location)
      } else {
        await applyAction(result)
      }
    }
  }}
>
  <div class="flex flex-col space-y-1.5 p-6">
    <h3
      class="whitespace-nowrap text-2xl font-semibold leading-none tracking-tight"
    >
      Edit Profile
    </h3>
  </div>
  <div class="space-y-6 p-6">
    <div class="flex flex-col items-center gap-4">
      <span
        class="relative flex h-20 w-20 shrink-0 overflow-hidden rounded-full"
      >
        <img
          class="aspect-square h-full w-full"
          alt="@shadcn"
          src="https://generated.vusercontent.net/placeholder-user.jpg"
        />
      </span>
      <div class="text-muted-foreground text-sm">
        Update your profile picture
      </div>
    </div>

    <div class="space-y-2">
      <label for="profile-pic">Picture</label>

      <FileUploader
        id="profile-pic"
        onFileChange={(file, previewUrl, resizedBlob) => {
          console.log(resizedBlob)
          user_form.profile_pic = resizedBlob
        }}
      />
    </div>
    <div class="space-y-2">
      <label
        class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        for="username"
      >
        Username
      </label>
      <input class="input input-bordered flex h-10 w-full" id="username" />
    </div>

    <!-- button -->
    <div class="flex justify-center">
      <button type="submit" class="btn btn-primary w-full"> Save </button>
    </div>
  </div>
</form>
