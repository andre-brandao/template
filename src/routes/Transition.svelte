<script>
  import { fade, fly } from 'svelte/transition'
  import { cubicIn, cubicOut } from 'svelte/easing'

  import { page, navigating } from '$app/stores'
  import { onNavigate } from '$app/navigation'
  import PreLoadingIndicator from './PreLoadingIndicator.svelte'

  export let key

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
{#key key}
  <div
    class="h-full overflow-scroll overflow-x-auto transition-all"
    in:fly={{ delay: 300, duration: 300, easing: cubicOut, x: 0, y: 240 }}
    out:fly={{ duration: 300, easing: cubicIn, x: 0, y: -240 }}
  >
    <slot />
  </div>
{/key}
