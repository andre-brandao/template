<script lang="ts">
  import '../app.css'
  // INLANG
  import { ParaglideJS } from '@inlang/paraglide-sveltekit'
  import { i18n } from '$lib/i18n'
  // DAISY THEMES
  import { themes, changeTheme } from '$lib'
  import { onMount } from 'svelte'
  // TOASTER
  import { Toaster, toast } from 'svelte-sonner'
  import NavBar from '$lib/components/navbar/NavBar.svelte'
  // STORE
  import { navigating } from '$app/stores'
  import { user } from '$lib/stores/user'
  // COMPONENTS
  import { ModalContainer } from '$lib/components/modal'
  import DrawerContainer from '$lib/components/drawer/base/DrawerContainer.svelte'
  import Transition from './Transition.svelte'
  import PreLoadingIndicator from './PreLoadingIndicator.svelte'

  import type { LayoutData } from './$types'

  export let data: LayoutData
  $user = data.user
  $: $user = data.user

  onMount(() => {
    changeTheme('sunset')
  })
</script>


<ParaglideJS {i18n}>
  <Toaster richColors closeButton />
  <!-- <DrawerContainer> -->
    <NavBar>
      <ModalContainer />
      <Transition>
        <slot></slot>
      </Transition>
    </NavBar>
  <!-- </DrawerContainer> -->
</ParaglideJS>

<style></style>
