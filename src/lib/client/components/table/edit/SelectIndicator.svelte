<script>
  export let isSelected
  export let isSomeSubRowsSelected
</script>

<input
  type="checkbox"
  bind:checked={$isSelected}
  indeterminate={$isSomeSubRowsSelected}
/>
