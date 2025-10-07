import '../../assets/app.js';

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('lobby-activity-chart');
  if (!container) return;

  const chart = echarts.init(container);
  chart.setOption({
    color: ['#60a5fa', '#f59e0b'],
    tooltip: { trigger: 'axis' },
    grid: { left: 36, right: 16, top: 30, bottom: 24 },
    legend: {
      data: ['魅力值', '互动量'],
      top: 5,
      textStyle: { color: '#e2e8f0', fontSize: 11 }
    },
    xAxis: {
      type: 'category',
      data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      axisLine: { lineStyle: { color: 'rgba(148,163,184,0.35)' } },
      axisLabel: { color: '#cbd5f5', fontSize: 11 },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: 'rgba(148,163,184,0.12)' } },
      axisLabel: { color: '#cbd5f5', fontSize: 11 }
    },
    series: [
      {
        name: '魅力值',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        areaStyle: { opacity: 0.15 },
        data: [80, 96, 90, 120, 140, 150, 138]
      },
      {
        name: '互动量',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        areaStyle: { opacity: 0.15 },
        data: [60, 72, 78, 84, 98, 110, 128]
      }
    ]
  });

  window.addEventListener('resize', () => chart.resize());
});

