<script>
  import { fade, fly } from 'svelte/transition'
  import { cubicIn, cubicOut } from 'svelte/easing'

  import { page, navigating } from '$app/stores'
  import { onNavigate } from '$app/navigation'
  import PreLoadingIndicator from './PreLoadingIndicator.svelte'

  onNavigate(navigation => {
    // @ts-expect-error
    if (!document.startViewTransition) return

    return new Promise(resolve => {
      // @ts-expect-error
      document.startViewTransition(async () => {
        resolve()
        await navigation.complete
      })
    })
  })
</script>

{#key $navigating}
  {#if $navigating}
    <PreLoadingIndicator />
  {/if}
  <div
    in:fly={{ duration: 200, easing: cubicIn, x: -300, y: 0 }}
    out:fly={{ duration: 200, easing: cubicOut, x: 300, y: 0 }}
    class="h-full overflow-scroll overflow-x-auto"
  >
    <slot />
  </div>
{/key}

<slot><!-- optional fallback --></slot>
