<script lang="ts">
  import '../app.css'

  import { themes, changeTheme } from '$lib'
  import ThemeSwiter from '$lib/components/ThemeSwiter.svelte'
  import { onMount } from 'svelte'
  import { Toaster, toast } from 'svelte-sonner'
  import { navigating } from '$app/stores'
  import NavBar from '$lib/components/NavBar.svelte'
  import type { LayoutData } from './$types'

  import { user } from '$lib/stores/user'

  export let data: LayoutData
  $user = data.user
  $: $user = data.user

  onMount(() => {
    let defaultTheme = 'bumblebee'
    changeTheme(defaultTheme)
  })
</script>

<Toaster richColors closeButton />
<NavBar />
{#if $navigating}
  <div class="flex h-full items-center justify-center">
    <span class="loading loading-infinity loading-lg"></span>
  </div>
{:else}
  <slot></slot>
{/if}

<style></style>
