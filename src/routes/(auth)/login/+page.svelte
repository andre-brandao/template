<script lang="ts">
  import * as m from '$msgs'
  import SEO, { getSEOProps } from '$lib/components/SEO/index.svelte'

  import { trpc } from '$trpc/client'
  import { page } from '$app/stores'

  let isRequested = false
  let isLoading = false
  let message = {
    success: false,
    message: '',
  }

  let email = ''
  async function sendMagicLink() {
    isLoading = true

    try {
      message = await trpc($page).auth.sendMagicLink.query({ email })
    } catch (error) {
      message = {
        success: false,
        message: 'An error occurred',
      }
    }
    isRequested = true
    isLoading = false
  }
</script>

<SEO
  {...getSEOProps({
    title: m.title_sign_in(),
    description: 'Sign in to your account',
  })}
/>

<main class="flex min-h-[90vh] items-center justify-center bg-base-200">
  <div class="w-full max-w-sm rounded-lg p-8 shadow-lg bg-base-100">
    <h1 class="text-center text-2xl font-semibold">{m.title_sign_in()}</h1>
    <div class="mt-6 flex flex-col gap-4">
      {#if isRequested && message.message}
        {#if message.success}
          <div class="alert alert-success">{message.message}</div>
        {:else}
          <div class="alert alert-error">{message.message}</div>
        {/if}
      {/if}
      <div></div>
      <div>
        <label for="email" class="block text-sm font-medium">Email</label>
        <input
          class="input input-bordered mt-1 w-full"
          name="email"
          id="email"
          type="email"
          bind:value={email}
        />
      </div>

      <button
        class="btn btn-primary mt-4 w-full"
        onclick={sendMagicLink}
        disabled={isLoading}
      >
        Get Magic Link
      </button>
    </div>
    <p class="mt-4 text-center text-sm">
      {m.dont_have_acc()}
      <a href="/signup" class="text-primary hover:underline">
        {m.create_an_acc()}
      </a>
    </p>

    <p class="mt-4 text-center text-sm">
      <a href="/login/password" class="btn btn-outline btn-primary">
        Login with password
      </a>
    </p>
  </div>
</main>
