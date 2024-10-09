<script lang="ts">
  import type { LayoutData } from './$types'

  export let data: LayoutData
</script>

<head>
  <title>{data.tenantInfo.name}</title>
</head>

<slot />
