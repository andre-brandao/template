<script>
  import { fade, fly } from 'svelte/transition'
  import { cubicIn, cubicOut } from 'svelte/easing'

  import { page } from '$app/stores'
</script>

{#key $page.url.pathname}
  <div
    in:fly={{ duration: 150, easing: cubicIn, x: 0, y: 240 }}
    out:fade
    class="h-full overflow-scroll overflow-x-auto"
  >
    <slot />
  </div>
{/key}
