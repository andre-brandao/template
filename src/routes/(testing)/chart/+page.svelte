<script lang="ts">
  import Area from '$components/chart/Area.svelte'
  import Bar from '$lib/components/chart/Bar.svelte'

  import { area_test_data } from '$components/chart/data'
  import Scatter from '$lib/components/chart/Scatter.svelte'
</script>

<Area data={area_test_data} />
<Bar data={area_test_data} />

<Scatter data={area_test_data} />
