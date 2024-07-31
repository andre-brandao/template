<script>
  import { onMount } from 'svelte'
  import Globe from './Globe.svelte'
  /**
   * @type {any}
   */
  let geojson

  onMount(async () => {
    geojson = await fetch(
      'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json',
    ).then(r => r.json())

    console.log('loading globe', geojson);
    console.log(geojson)
  })
</script>

{#if geojson}
  <Globe data={{ geojson }} />
{/if}
