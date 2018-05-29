
<template>
  <div>
    <div
      class="trace-container"
      v-for="(trace, gid) of traces"
      :key="gid"
    >

      <gid-label :gid="gid"/>

      <dygraph
        v-if="trace.chart.data.length"
        :data="trace.chart.data"
        :config="trace.chart.config"
      />

      <a
        class="trace-download"
        :download="trace.download.filename"
        :href="trace.download.hrefData"
      >
        <Icon type="android-download" size="24"></Icon>
      </a>

    </div>
  </div>
</template>


<script>
  import get from 'lodash/get';
  import store from '@/store';
  import Dygraph from '@/components/shared/dygraph.vue';
  import GidLabel from '@/components/shared/gid-label.vue';

  export default {
    name: 'cell-traces',
    components: {
      dygraph: Dygraph,
      'gid-label': GidLabel,
    },
    data() {
      return {
        traces: {},
        hoveredGid: null,
      };
    },
    mounted() {
      store.$on('ws:simulation_result', (data) => {
        // TODO: this handler should be on sim-config-tab component level
        // TODO: refactor
        if (!data.time.length) return;

        const gids = Object.keys(data.voltage);
        gids.forEach((gid) => {
          const secNames = Object.keys(data.voltage[gid]);
          const shortSecNames = secNames.map(secName => secName.match(/\.(.*)/)[1]);

          const chartDataDiff = data.time.map((timestamp, i) => {
            return secNames.reduce((trace, secName) => trace.concat(data.voltage[gid][secName][i]), [timestamp]);
          });

          const chartData = get(this.traces, `${gid}.chart.data`, []).concat(chartDataDiff);

          const self = this;

          this.$set(this.traces, gid, {
            chart: {
              data: chartData,
              config: {
                labels: ['t'].concat(shortSecNames),
                highlightCallback(event, x, points, row, seriesName) {
                  self.onHover(gid);
                },
                unhighlightCallback() {
                  self.onHoverEnd();
                },
              },
            },
            download: {
              filename: `${gid}-sim-trace.csv`,
              hrefData: `data:text/plain;base64,${btoa(chartData.join('\n'))}`,
            },
          });
        });
      });
      store.$on('resetTraces', () => { this.traces = {}; });
    },
    methods: {
      onHover(gid) {
        if (!this.hoveredGid) {
          this.hoveredGid = Number(gid);
          store.$dispatch('simConfigGidLabelHovered', this.hoveredGid);
        }
      },
      onHoverEnd() {
        this.hoveredGid = null;
        store.$dispatch('simConfigGidLabelUnhovered');
      },
    },
  };
</script>


<style lang="scss" scoped>
  .trace-container {
    position: relative;
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .trace-download {
    display: block;
    height: 16px;
    position: absolute;
    right: 0;
    bottom: 0;
  }
</style>
