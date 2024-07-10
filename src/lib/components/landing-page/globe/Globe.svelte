<script lang="ts">
  // @ts-nocheck
  import {
    Area,
    Axis,
    Chart,
    Highlight,
    GeoContext,
    GeoPath,
    Svg,
    Tooltip,
    TooltipItem,
    Bars,
    Graticule,
    TransformContext,
  } from 'layerchart'
  import { PeriodType, format, formatDate } from 'svelte-ux'
  import { scaleTime, scaleBand } from 'd3-scale'

  import { geoOrthographic } from 'd3-geo'
  import { feature } from 'topojson-client'

  import { Button, ButtonGroup, Field, RangeField, timerStore } from 'svelte-ux'

  export let data

  const countries = feature(data.geojson, data.geojson.objects.countries)
  let transformContext: TransformContext

  let velocity = 3
  let isSpinning = true
  const timer = timerStore({
    delay: 1,
    onTick() {
      transformContext.translate.update(value => {
        return {
          x: (value.x += velocity),
          y: value.y,
        }
      })
    },
    disabled: !isSpinning,
  })
  $: isSpinning ? timer.start() : timer.stop()
  $timer
</script>

<Chart
  geo={{
    projection: geoOrthographic,
    fitGeojson: countries,
    applyTransform: ['rotate'],
  }}
  on:dragstart={() => timer.stop()}
  on:dragend={() => {
    if (isSpinning) {
      // Restart
      timer.start()
    }
  }}
  bind:transformContext
  let:tooltip
  let:projection
>
  {@const [yaw, pitch, roll] = projection.rotate()}
  <Svg>
    <GeoPath geojson={{ type: 'Sphere' }} class="fill-blue-400/20" />

    <!-- Back -->
    <GeoContext
      projection={geoOrthographic}
      fitGeojson={countries}
      rotate={{ yaw: yaw + 180, pitch: -pitch, roll: -roll }}
      reflectX
    >
      <Graticule class="stroke-surface-content/5" />
      {#each countries.features as country}
        <GeoPath
          geojson={country}
          class="fill-surface-content/10 stroke-surface-content/5"
          reflectX
        />
      {/each}
    </GeoContext>

    <!-- Front -->
    <Graticule class="stroke-surface-content/20" />
    {#each countries.features as country}
      <GeoPath
        geojson={country}
        class="cursor-pointer fill-surface-content/70 stroke-surface-100/30 hover:fill-primary/70"
        {tooltip}
      />
    {/each}
  </Svg>

  <Tooltip>
    <div slot="header" let:data>{data.properties.name}</div>
  </Tooltip>
</Chart>
