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
  import { createUserContext } from '$lib/stores/user'
  import { createCartContext } from '$lib/stores/cart'
  // COMPONENTS
  import { ModalContainer } from '$lib/components/modal'
  import DrawerContainer from '$lib/components/drawer/base/DrawerContainer.svelte'
  import Transition from './Transition.svelte'
  import type { LayoutData } from './$types'

  export let data: LayoutData

  const user = createUserContext(data.user)
  $: user.set(data.user)
  const cart = createCartContext()

  onMount(() => {
    changeTheme('bumblebee')
  })
</script>

<ParaglideJS {i18n}>
  <Toaster richColors closeButton />
  <!-- <DrawerContainer> -->
  <NavBar>
    <ModalContainer />
    <Transition key={data.transition_key}>
      <slot />
    </Transition>
  </NavBar>
  <!-- </DrawerContainer> -->
</ParaglideJS>
