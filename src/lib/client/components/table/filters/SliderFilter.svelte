<script context="module" lang="ts">
  export const isNumber = (value: unknown) => typeof value === 'number'
</script>

<script lang="ts">
  import type { Writable } from 'svelte/store'

  export let filterValue: Writable<number>
  export let preFilteredValues: Writable<unknown[]>
  $: min =
    $preFilteredValues.length === 0
      ? 0
      : Math.min(...$preFilteredValues.filter(isNumber))
  $: max =
    $preFilteredValues.length === 0
      ? 0
      : Math.max(...$preFilteredValues.filter(isNumber))
</script>

<input
  type="range"
  {min}
  {max}
  bind:value={$filterValue}
  on:click|stopPropagation
/>
