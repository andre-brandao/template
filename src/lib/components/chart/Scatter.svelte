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
    Points,
  } from 'layerchart'

  import { scaleBand, scaleTime } from 'd3-scale'
  export let data
</script>

<div class="h-[300px] rounded border p-4">
  <Chart
    {data}
    x="date"
    xScale={scaleTime()}
    y="value"
    yDomain={[0, null]}
    yNice
    padding={{ left: 16, bottom: 24 }}
    tooltip={{ mode: 'bisect-x' }}
  >
    <Svg>
      <Axis placement="left" grid rule />
      <Axis placement="bottom" rule />
      <!-- format={d => new Date(d).getDay().toString()} -->
      <Points class="fill-primary/10 stroke-primary" />
      <Highlight points lines />
    </Svg>
    <Tooltip header={data => JSON.stringify(data)} let:data>
      <TooltipItem label="value" value={data.value} />
    </Tooltip>
  </Chart>
</div>
