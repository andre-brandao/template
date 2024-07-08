<script lang="ts">
  import { Chart } from 'chart.js/auto'

  let canvas: HTMLCanvasElement

  type ChartTypes =
    | 'line'
    | 'bar'
    | 'pie'
    | 'doughnut'
    | 'polarArea'
    | 'radar'
    | 'scatter'

  interface Dataset {
    type: ChartTypes
    label: string
    data: number[]
    borderWidth?: number
  }

  let chart: Chart

  function mountChart(node: HTMLCanvasElement) {
    chart = new Chart(node, {
      data: {
        labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
        datasets: [
          {
            type: 'bar',
            label: '# of Votes',
            data: [12, 19, 3, 5, 2, 3],
            borderWidth: 1,
          },
        ],
      },
      options: {
        plugins: {
          legend: {
            labels: {
              font: {
                style: 'inherit',
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    })
  }
</script>

<canvas bind:this={canvas} use:mountChart></canvas>
