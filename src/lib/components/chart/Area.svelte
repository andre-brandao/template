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
    pivotLonger,
  } from 'layerchart'
  import { scaleOrdinal, scaleTime } from 'd3-scale'

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
      <LinearGradient
        id="tw-1"
        class="from-primary to-base-100"
        vertical
        let:url
      >
        <Axis placement="left" grid rule />
        <Axis placement="bottom" grid rule />
        <!-- format={d => new Date(d).getDay()} -->
        <Area line={{ class: 'stroke-2 stroke-primary' }} fill={url} />
        <Highlight points lines />
      </LinearGradient>
    </Svg>
    <Tooltip header={data => JSON.stringify(data)} let:data>
      <TooltipItem label="value" value={data.value} />
    </Tooltip>
  </Chart>
</div>
