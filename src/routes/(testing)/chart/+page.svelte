<script lang="ts">
  import Area from '$components/chart/Area.svelte'
  import Bar from '$lib/components/chart/Bar.svelte'

  import { area_test_data } from '$components/chart/data'
  import Scatter from '$lib/components/chart/Scatter.svelte'

  const data = area_test_data.map(d => ({ ...d, date: new Date(d.date) }))
</script>

<Area {data} />
<Bar {data} />

<Scatter {data} />
