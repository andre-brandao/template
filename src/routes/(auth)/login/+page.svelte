<!-- <script lang="ts">
  import * as m from '$lib/i18n/paraglide/messages'
  import SEO, { getSEOProps } from '$components/SEO/index.svelte'
  import { enhance } from '$app/forms'

  let isLoading = false

  import type { ActionData } from './$types'
  import Info from '$components/Info.svelte'

  export let form: ActionData
</script>

<SEO
  {...getSEOProps({
    title: m.title_sign_in(),
    description: 'Sign in to your account',
  })}
/>

<main class="flex min-h-[90vh] items-center justify-center bg-base-200">
  <div class="w-full max-w-sm rounded-lg bg-base-100 p-8 shadow-lg">
    <h1 class="text-center text-2xl font-semibold">{m.title_sign_in()}</h1>
    <form
      method="post"
      action="?/login"
      use:enhance
      class="mt-6 flex flex-col gap-4"
    >
      {#if form}
        <Info {...form} />
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
        Get Magic Link
      </button>
    </form>
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

    <p class="mt-4 text-center text-sm">
      <a href="/login/google" class="btn btn-outline btn-primary">
        Login with GOOGLE
      </a>
    </p>
  </div>
</main> -->

<script lang="ts">
  import * as m from '$lib/i18n/paraglide/messages'
  import SEO, { getSEOProps } from '$components/SEO/index.svelte'
  import type { ActionData } from './$types'
  import Info from '$components/Info.svelte'

  export let form: ActionData
  import LoginForm from '$lib/client/components/login-form.svelte'
</script>

<SEO
  {...getSEOProps({
    title: m.title_sign_in(),
    description: 'Sign in to your account',
  })}
/>
<div class="flex h-screen w-full items-center justify-center px-4">
  <LoginForm>
    {#if form}
      <Info {...form} />
    {/if}
  </LoginForm>
</div>
