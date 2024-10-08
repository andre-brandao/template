<script lang="ts">
  import { debounce } from '$lib/utils'
  import type { Readable, Writable } from 'svelte/store'

  export let filterValue: Writable<string>
  export let values: Readable<string[]>
  export let preFilteredValues: Readable<string[]>

  export let placeholder = 'filter...'

  export let change: undefined | ( (value: string) => void) = undefined

  const debounceChange = debounce((value: string) => {
    change?.(value)
  }, 350)
</script>

<!-- 
<label for="filter-input">
  {$values.length} out of {$preFilteredValues.length}
</label> -->
<input
  id="filter-input"
  type="text"
  class="input input-bordered"
  bind:value={$filterValue}
  {placeholder}
  on:input={() => debounceChange($filterValue)}
/>

<style>
  input {
    width: 8rem;
  }
</style>
