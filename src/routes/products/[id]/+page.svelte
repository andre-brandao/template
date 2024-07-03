<script lang="ts">
  import type { PageData } from './$types'

  import Detail from '$components/detail/Detail1.svelte'

  export let data: PageData
  const { produto } = data
</script>

<Detail {produto}></Detail>
