<script lang="ts">
  import * as m from '$msgs'
  import SEO, { getSEOProps } from '$lib/components/SEO/index.svelte'
  import { enhance } from '$app/forms'

  let isRequested = false
  let isLoading = false

  import type { ActionData } from './$types'

  export let form: ActionData
</script>

<SEO
  {...getSEOProps({
    title: m.title_sign_in(),
    description: 'Reset your password',
  })}
/>

<main class="flex min-h-[90vh] items-center justify-center bg-base-200">
  <div class="w-full max-w-sm rounded-lg bg-base-100 p-8 shadow-lg">
    <h1 class="text-center text-2xl font-semibold">Reset Password</h1>
    <form method="post" use:enhance class="mt-6 flex flex-col gap-4">
      {#if form?.message && form.success}
        <div role="alert" class="alert alert-success">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6 shrink-0 stroke-current"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{form.message}</span>
        </div>
      {:else if form?.message}
        <div role="alert" class="alert alert-warning">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6 shrink-0 stroke-current"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span>{form.message}</span>
        </div>
      {/if}
      <div></div>
      <div>
        <label for="email" class="block text-sm font-medium">Email</label>
        <input
          class="input input-bordered mt-1 w-full"
          name="email"
          id="email"
          type="email"
        />
      </div>

      <button class="btn btn-primary mt-4 w-full" disabled={isLoading}>
        Get password reset link
      </button>
    </form>
    <p class="mt-4 text-center text-sm">
      <a href="/login" class="text-primary hover:underline">Back to login</a>
    </p>
  </div>
</main>
