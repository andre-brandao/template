<script lang="ts">
  import SEO, { getSEOProps } from '$lib/components/SEO/index.svelte'
  import { enhance } from '$app/forms'
  import * as m from '$msgs'

  import type { ActionData } from './$types'

  export let form: ActionData
</script>

<SEO
  {...getSEOProps({
    title: m.title_sign_in(),
    description: 'Sign in using password',
  })}
/>

<main class="flex min-h-[90vh] items-center justify-center bg-base-200">
  <div class="w-full max-w-sm rounded-lg p-8 shadow-lg bg-base-100">
    <h1 class="text-center text-2xl font-semibold">{m.title_sign_in()}</h1>
    <form method="post" use:enhance class="mt-6 flex flex-col gap-4">
      <div>
        <label for="email" class="block text-sm font-medium">Email</label>
        <input
          class="input input-bordered mt-1 w-full"
          name="email"
          id="email"
          type="email"
        />
      </div>
      <div>
        <label for="password" class="block text-sm font-medium">
          {m.password()}
        </label>
        <input
          class="input input-bordered mt-1 w-full"
          type="password"
          name="password"
          id="password"
        />
      </div>
      <button class="btn btn-primary mt-4 w-full">{m.continu()}</button>
      <p class=" mt-2 text-center text-sm">{form?.message ?? ''}</p>
    </form>
    <p class="mt-4 text-center text-sm">
      {m.dont_have_acc()}
      <a href="/signup" class="text-primary hover:underline">
        {m.create_an_acc()}
      </a>
    </p>

    {#if form?.message}
      <p class="mt-2 text-center text-sm">
        Forgot your password?

        <a href="/reset-password" class="link">Reset it here</a>
      </p>
    {/if}
  </div>
</main>
