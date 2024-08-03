<script lang="ts">
  import type { PageData } from './$types'
  import { enhance } from '$app/forms'

  import type { ActionData } from './$types'

  export let form: ActionData

  export let data: PageData

  import SEO, { getSEOProps } from '$lib/components/SEO/index.svelte'

  let password = ''

  let password_confirm = ''

  $: isValid = password === password_confirm && password.length >= 6
</script>

<SEO
  {...getSEOProps({
    title: 'Reset Password',
    description: 'Enter your new password',
  })}
/>
<div class="bg-background flex h-full flex-col items-center justify-center">
  <div class="mx-auto w-full max-w-md space-y-6">
    <div class="text-center">
      <h1 class="text-3xl font-bold">Password Reset</h1>
      <p class="text-muted-foreground mt-2">
        Enter your new password {data.email}
      </p>
    </div>
    <form
      method="post"
      use:enhance
      class="bg-card text-card-foreground rounded-lg border border-primary shadow-sm"
    >
      <div class="space-y-4 p-6">
        <div class="space-y-2">
          <label
            class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            for="password"
          >
            Password
          </label>
          <input
            bind:value={password}
            class="input input-bordered w-full disabled:cursor-not-allowed disabled:opacity-50"
            id="password"
            name="password"
            type="password"
          />

          <label
            class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            for="password_c"
          >
            Confirm Password
          </label>
          <input
            bind:value={password_confirm}
            class="input input-bordered w-full disabled:cursor-not-allowed disabled:opacity-50"
            id="password_c"
            type="password"
          />

          {#if !isValid}
            <p class="text-sm text-error">
              Passwords do not match or are too short
            </p>
          {/if}

          <p class=" mt-2 text-center text-sm">{form?.message ?? ''}</p>

          <button class="btn btn-outline w-full">Request Password Reset</button>
        </div>
      </div>
    </form>
  </div>
</div>
