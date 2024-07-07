<script lang="ts" generics="T extends {id:any}">
  // import { rowChanges } from '.'
  import { getRowChanges } from '.'
  const rowChanges = getRowChanges<T>()

  export let row: T
  const id = row.id

  let isEdit = false

  function setEdited(val: boolean) {
    isEdit = val
    rowChanges.update(rowChanges => {
      const currState = { ...rowChanges }
      if (val === false && id in currState) {
        delete currState[id]
      } else {
        currState[id] = { ...row }
      }
      console.log(currState)
      return currState
    })
  }

  $: {
    if ($rowChanges[id]) {
      isEdit = true
    } else {
      isEdit = false
    }
  }
</script>

<input
  type="checkbox"
  class="toggle"
  bind:checked={isEdit}
  on:change={e => {
    const input = e.target as HTMLInputElement
    const checked = input.checked
    setEdited(checked)
  }}
/>
