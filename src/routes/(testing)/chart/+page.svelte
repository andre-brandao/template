<script lang="ts">
  import type { PageData } from './$types'

  import Chart from '$components/Chart.svelte'

  import SuperSelect from '$lib/components/input/Select.svelte'
  export let data: PageData
</script>

<Chart />
