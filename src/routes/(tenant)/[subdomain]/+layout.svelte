<script lang="ts">
  import NavBar from '$lib/client/components/navbar/NavBar.svelte'
  import type { LayoutData } from './$types'
  import { createUserContext } from '$lib/client/stores/user'
  import { createCartContext } from '$lib/client/stores/cart'

  export let data: LayoutData
  const user = createUserContext(data.user)
  const cart = createCartContext()
</script>


<NavBar  tenantName={data.tenantInfo.name}>
  <slot />
</NavBar>
