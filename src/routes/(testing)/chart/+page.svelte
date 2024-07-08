<script lang="ts">
  import type { PageData } from './$types'

  import Chart from '$components/Chart.svelte'

  import SuperSelect from '$components/SuperSelect.svelte'
  export let data: PageData
</script>

<SuperSelect />
<Chart />
