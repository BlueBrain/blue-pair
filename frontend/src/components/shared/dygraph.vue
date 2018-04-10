
<template>
  <div class="graph-container" ref="graph"></div>
</template>


<script>
  import Dygraph from 'dygraphs';

  import store from '@/store';

  export default {
    name: 'dygraph',
    props: ['data', 'labels'],
    mounted() {
      // dygraph in hidden block is being rendered with zero size
      // TODO: refactor this
      const width = this.$refs.graph.parentElement.parentElement.parentElement.parentElement.clientWidth - 32;

      this.graph = new Dygraph(this.$refs.graph, this.data, {
        width,
        height: 320,
        labels: this.labels,
        labelsSeparateLines: true,
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
  .graph-container {
    height: 100%;
  }
</style>
