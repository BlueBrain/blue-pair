
<template>
  <div class="container">
    <div class="graph-container" ref="graph"></div>
    <div class="graph-labels-container" ref="labelContainer"></div>
  </div>
</template>


<script>
  import Dygraph from 'dygraphs';

  import store from '@/store';

  function legendFormatter(data) {
    const g = data.dygraph;

    if (g.getOption('showLabelsOnHighlight') !== true) return '';

    const sepLines = g.getOption('labelsSeparateLines');
    let html;

    if (typeof data.x === 'undefined') {
      if (g.getOption('legend') !== 'always') {
        return '';
      }

      html = '';
      for (let i = 0; i < data.series.length; i++) {
        const series = data.series[i];
        if (!series.isVisible) continue;

        html += `<br/><span style='font-weight: bold; color: ${series.color};'>${series.labelHTML}</span>`;
      }
      return html;
    }

    html = `time: ${data.xHTML}`;
    for (let i = 0; i < data.series.length; i++) {
      const series = data.series[i];
      if (!series.isVisible) continue;
      if (sepLines) html += '<br>';
      const cls = series.isHighlighted ? ' class="highlight"' : '';
      html += `<span${cls}> <b><span style='color: ${series.color};'>${series.labelHTML}</span></b>:&#160;${series.yHTML}</span>`;
    }
    return html;
  }

  export default {
    name: 'dygraph',
    props: ['data', 'labels'],
    mounted() {
      // dygraph in hidden block is being rendered with zero size
      // TODO: refactor this
      const width = this.$refs.graph.parentElement.parentElement.parentElement.parentElement.parentElement.clientWidth - 137;

      this.graph = new Dygraph(this.$refs.graph, this.data, {
        width,
        legendFormatter,
        height: 320,
        labels: this.labels,
        labelsSeparateLines: true,
        labelsDiv: this.$refs.labelContainer,
        xlabel: 'time [ms]',
        ylabel: 'voltage [mV]',
        axes: {
          x: { valueFormatter: v => v.toFixed(2) },
          y: { valueFormatter: v => v.toFixed(2) },
        },
        highlightSeriesOpts: {
          strokeWidth: 2,
          strokeBorderWidth: 1,
          highlightCircleSize: 3,
        },
      });

      store.$on('redrawGraphs', () => this.graph.resize());
    },
    watch: {
      data() {
        this.graph.updateOptions({ file: this.data, labels: this.labels });
      },
    },
    beforeDestroy() {
      this.graph.destroy();
    },
  };
</script>


<style lang="scss" scoped>
  .container {
    height: 100%;
    position: relative;
  }

  .graph-labels-container {
    width: 105px;
    position: absolute;
    right: 0;
    top: 0;
  }
</style>
