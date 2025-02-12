<template>
  <div>
    <div
      class="text-center py-1 mb-1 cursor-pointer border-y border-accent-200 transition transition-colors hover:text-accent-600"
      @click="changeGraph()"
    >
      点击这里切换图表类型
    </div>
    <div ref="chartDom" class="w-full aspect-ratio-1/1 md:aspect-ratio-16/10"></div>
  </div>
</template>
<script lang="ts" setup>
import { GraphDataSunburst } from '@/lib/Graph'
import * as echarts from 'echarts/core'
import {
  ToolboxComponent,
  ToolboxComponentOption,
  TooltipComponent,
  TooltipComponentOption,
  LegendComponent,
  LegendComponentOption,
} from 'echarts/components'
/* Attention: Sunburst Chart lacks the "label-position: outside" option, so we give it up 💩 */
import { PieChart, BarChart } from 'echarts/charts'
import { LabelLayout } from 'echarts/features'
import { CanvasRenderer } from 'echarts/renderers'
import { getGraphBarOption } from '@/lib/graphBar'

const props = defineProps<{
  data: GraphDataSunburst[]
  dataOut: GraphDataSunburst[]
  muchLegend?: boolean
}>()

echarts.use([ToolboxComponent, TooltipComponent, LegendComponent, PieChart, BarChart, CanvasRenderer, LabelLayout])

type EChartsOption = echarts.ComposeOption<ToolboxComponentOption | TooltipComponentOption | LegendComponentOption>
const option = computed<EChartsOption>(() => {
  const returnData: EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b0}: {c0}({d0}%)',
    },
    legend: {
      data: props.data.map((item) => item.name),
    },
    toolbox: {
      feature: {
        saveAsImage: {},
      },
    },
    series: [
      {
        type: 'pie',
        radius: ['0%', '60%'],
        label: {
          position: 'outside',
          formatter: '{b}: {c}({d}%)',
        },
        labelLine: {
          length: 50,
        },
        data: props.data.sort((a, b) => Number(a.id) - Number(b.id)),
      },
      {
        type: 'pie',
        radius: ['60%', '70%'],
        label: {
          show: false,
        },
        itemStyle: { color: (params: any) => (params.dataIndex % 2 ? '#0891b2' : '#0369a1') },
        data: props.dataOut.sort((a, b) => Number(a.id) - Number(b.id)),
      },
    ],
  }
  const mediaData: EChartsOption = {
    media: [
      {
        query: {
          maxWidth: 500,
        },
        option: {
          series: [
            {
              radius: ['0%', '40%'],
              center: ['50%', '75%'],
            },
            {
              radius: ['40%', '50%'],
              center: ['50%', '75%'],
            },
          ],
        },
      },
    ],
  }
  props.muchLegend && Object.assign(returnData, mediaData)
  return returnData
})
let GraphSunburst: echarts.ECharts
const chartDom = ref<HTMLElement>()!
onMounted(() => {
  if (chartDom.value) {
    GraphSunburst = echarts.init(chartDom.value)
    window.addEventListener('resize', () => GraphSunburst.resize())
    option.value && GraphSunburst.setOption(option.value)
    watchEffect(() => {
      if (props.data.length) option.value && GraphSunburst.setOption(option.value)
    })
  }
})

const showGraph = ref(true)
function changeGraph() {
  showGraph.value = !showGraph.value
  const dataMale: number[] = []
  const dataFemale: number[] = []
  props.dataOut.map((item) => {
    if (item.name === '男性') dataMale.push(item.value)
    else if (item.name === '女性') dataFemale.push(item.value)
  })

  const graphOption = showGraph.value
    ? option.value
    : getGraphBarOption(
        props.data.map((item) => item.name),
        props.data.map((item) => item.value),
        dataMale,
        dataFemale
      )
  GraphSunburst.setOption(graphOption, true)
}
</script>
<style lang="postcss" scoped></style>
