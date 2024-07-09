<script>
  import {
    Area,
    Axis,
    Chart,
    ChartClipPath,
    Highlight,
    Labels,
    LinearGradient,
    Point,
    RectClipPath,
    Spline,
    Svg,
    Text,
    Tooltip,
    TooltipItem,
    Bars,
  } from 'layerchart'

  import { scaleBand } from 'd3-scale'
  export let data
</script>

<div class="group h-[300px] rounded border p-4">
  <Chart
    {data}
    x="date"
    xScale={scaleBand().padding(0.4)}
    y="value"
    yDomain={[0, null]}
    yNice={4}
    padding={{ left: 16, bottom: 24 }}
    tooltip={{ mode: 'band' }}
  >
    <Svg>
      <Axis placement="left" grid rule />
      <Axis
        placement="bottom"
        format={d => new Date(d).getDate().toString()}
        rule
      />
      <Bars
        radius={4}
        strokeWidth={1}
        class="fill-primary transition-colors group-hover:fill-gray-300"
      />
      <Highlight area>
        <svelte:fragment slot="area" let:area>
          <RectClipPath
            x={area.x}
            y={area.y}
            width={area.width}
            height={area.height}
            spring
          >
            <Bars radius={4} strokeWidth={1} class="fill-primary" />
          </RectClipPath>
        </svelte:fragment>
      </Highlight>
    </Svg>
    <Tooltip header={data => JSON.stringify(data)} let:data>
      <TooltipItem label="value" value={data.value} />
    </Tooltip>
  </Chart>
</div>
