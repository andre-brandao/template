<script lang="ts">
  import { ParaglideJS } from '@inlang/paraglide-sveltekit'
  import { i18n } from '$lib/i18n'

  import '../app.css'

  import { themes, changeTheme } from '$lib'
  import { onMount } from 'svelte'
  import { Toaster, toast } from 'svelte-sonner'
  import { navigating } from '$app/stores'
  import NavBar from '$lib/components/navbar/NavBar.svelte'
  import type { LayoutData } from './$types'

  import { user } from '$lib/stores/user'

  import { ModalContainer } from '$lib/components/modal'
  import Transition from '$lib/components/Transition.svelte'
  import PreLoadingIndicator from './PreLoadingIndicator.svelte'

  export let data: LayoutData
  $user = data.user
  $: $user = data.user

  onMount(() => {
    changeTheme('sunset')
  })
</script>

{#if $navigating}
	<PreLoadingIndicator />
{/if}

<ParaglideJS {i18n}>
  <ModalContainer />
  <Toaster richColors closeButton  />
  <NavBar>
    <Transition>
      <slot></slot>
    </Transition>
  </NavBar>
</ParaglideJS>

<style></style>
