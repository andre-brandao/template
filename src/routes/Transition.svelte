<script>
  import { fade, fly } from 'svelte/transition'
  import { cubicIn, cubicOut } from 'svelte/easing'

  import { page, navigating } from '$app/stores'
  import { onNavigate } from '$app/navigation'
  import PreLoadingIndicator from './PreLoadingIndicator.svelte'

  export let data

  onNavigate(navigation => {
    // @ts-expect-error
    if (!document.startViewTransition) return

    return new Promise(resolve => {
      // @ts-expect-error
      document.startViewTransition?.(async () => {
        resolve()
        await navigation.complete
      })
    })
  })
</script>

<!-- TODO: fix duplicating page bug -->
<!-- or $navigating -->
{#key data.url}
  <div
    in:fly={{
      duration: 300,
      x: 0,
      y: 240,
      easing: cubicOut,
      delay: 2000,
    }}
    out:fly={{ duration: 300, x: 0, y: -240, easing: cubicIn }}
    class="h-full overflow-scroll overflow-x-auto"
  >
    <slot />
  </div>
{/key}
