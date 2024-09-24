<script lang="ts">
  import type { Readable, Writable } from 'svelte/store'

  export let filterValue: Writable<string>
  export let values: Readable<string[]>
  export let preFilteredValues: Readable<string[]>
</script>

<label for="filter-input">
  {$values.length} out of {$preFilteredValues.length}
</label>
<input
  id="filter-input"
  type="text"
  bind:value={$filterValue}
  placeholder="filter..."
/>

<style>
  input {
    width: 8rem;
  }
</style>
