<script lang="ts">
  // import type { PageData } from './$types'

  import { trpc } from '$trpc/client'
  import { page } from '$app/stores'
  import { toast } from 'svelte-sonner'
  import { goto } from '$app/navigation'

  import SEO, { getSEOProps } from '$lib/components/SEO/index.svelte'

  // export let data: PageData
  let email = ''
  let isLoading = false

  async function resetPassword() {
    isLoading = true
    const { data, error } = await trpc($page).auth.resetPassword.query({
      email,
    })
    console.log('reset password')
    if (error) {
      toast.error(error)
      return
    }

    if (data) {
      toast.success(data)
    }
  }
</script>

<SEO
  {...getSEOProps({
    title: 'Password Reset',
    description: 'Enter your email address to receive a password reset code',
  })}
/>

<div class="bg-background flex h-full flex-col items-center justify-center">
  <div class="mx-auto w-full max-w-md space-y-6">
    <div class="text-center">
      <h1 class="text-3xl font-bold">Password Reset</h1>
      <p class="text-muted-foreground mt-2">
        Enter your email address to receive a password reset code
      </p>
    </div>
    <div
      class="text-card-foreground rounded-lg border border-primary bg-surface-100 shadow-sm"
    >
      <div class="space-y-4 p-6">
        <div class="space-y-2">
          <label
            class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            for="email"
          >
            Email
          </label>
          <input
            bind:value={email}
            class="input input-bordered w-full disabled:cursor-not-allowed disabled:opacity-50"
            id="email"
            type="email"
          />

          <button
            disabled={isLoading}
            onclick={resetPassword}
            class="btn btn-outline w-full"
          >
            Request Password Reset
          </button>
          <div class="flex items-center justify-center">
            <a href="/login" class="link-hover link">Back to login</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
