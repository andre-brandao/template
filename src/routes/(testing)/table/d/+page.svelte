<script lang="ts">
  import type { PageData } from './$types'

  export let data: PageData
  import DrizzleTable from '$lib/components/table/DrizzleTable.svelte'

  const cfg = data.cfg
</script>

<DrizzleTable {cfg} />
