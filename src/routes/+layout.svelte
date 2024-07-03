<script lang="ts">
  import '../app.css'

  import { themes, changeTheme } from '$lib'
  import ThemeSwiter from '$lib/components/navbar/ThemeSwiter.svelte'
  import { onMount } from 'svelte'
  import { Toaster, toast } from 'svelte-sonner'
  import { navigating } from '$app/stores'
  import NavBar from '$lib/components/navbar/NavBar.svelte'
  import type { LayoutData } from './$types'

  import { user } from '$lib/stores/user'

  import { ModalContainer } from '$lib/components/modal'
  import Loading from '$lib/components/Loading.svelte'

  export let data: LayoutData
  $user = data.user
  $: $user = data.user

  onMount(() => {
    changeTheme('bumblebee')
  })
</script>

<ModalContainer />
<Toaster richColors closeButton />
<NavBar>
  {#if $navigating}
    <Loading />
  {:else}
    <slot></slot>
  {/if}
</NavBar>

<style></style>
