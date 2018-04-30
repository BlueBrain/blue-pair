
<template>
  <div>
    <div
      class="trace-container"
      v-for="(trace, gid) of traces"
      :key="gid"
    >
      <h4
        @mouseover="onGidHover(gid)"
        @mouseleave="onGidUnhover()"
      >
        GID: {{ gid }}
      </h4>
      <dygraph
        v-if="trace.chart.data.length"
        :data="trace.chart.data"
        :labels="trace.chart.labels"
      />
    </div>
  </div>
</template>


<script>
  import store from '@/store';
  import Dygraph from '@/components/shared/dygraph.vue';

  export default {
    name: 'cell-traces',
    components: {
      dygraph: Dygraph,
    },
    data() {
      return {
        traces: {},
      };
    },
    methods: {},
    mounted() {
      store.$on('ws:simulation_result', (data) => {
        // TODO: this handler should be on sim-config-tab component level
        // TODO: refactor
        const traceGids = Object.keys(data);
        traceGids.forEach((gid) => {
          const secNames = Object.keys(data[gid].voltage);
          const shortSecNames = secNames.map(secName => secName.match(/\.(.*)/)[1]);

          const chartData = data[gid].time.map((timestamp, i) => {
            return secNames.reduce((trace, secName) => trace.concat(data[gid].voltage[secName][i]), [timestamp]);
          });

          this.traces[gid] = {
            chart: {
              data: chartData,
              labels: ['t'].concat(shortSecNames),
            },
            download: {},
          };
        });

        // this.collapseAllPanels();
        // this.uncollapsePanel(PANEL.traces);
      });
    },
  };
</script>


<style lang="scss" scoped>
  .trace-container {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }
  }
</style>
