<script lang="ts" generics="T extends {id: any}">
  import { onDestroy } from 'svelte'
  import { type EditableTypes, getRowChanges } from '.'
  const rowChanges = getRowChanges<T>()

  export let id: any
  export let colID: keyof T
  export let editT: EditableTypes
  export let value: any

  let rInEdit = false

  let changedRow = <T>{}

  $: {
    if ($rowChanges[id]) {
      rInEdit = true
      changedRow = $rowChanges[id]
    } else {
      rInEdit = false
      changedRow = <T>{}
    }
  }
</script>

{#if rInEdit !== true}
  <span>
    {value}
  </span>
{:else if editT === 'text'}
  <input
    class="input input-sm input-bordered w-full"
    type="text"
    bind:value={changedRow[colID]}
  />
{:else if editT === 'number'}
  <input
    class="input input-sm input-bordered w-full"
    type="number"
    bind:value={changedRow[colID]}
  />
{:else}
  <span>
    {value}
  </span>
{/if}
