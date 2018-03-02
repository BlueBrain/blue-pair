
<template>
  <div class="graph-container" ref="graph"></div>
</template>


<script>
  import Dygraph from 'dygraphs';

  export default {
    name: 'dygraph',
    props: ['data', 'labels'],
    mounted() {
      this.graph = new Dygraph(this.$refs.graph, this.data, {labels: this.labels});
    },
    watch: {
      data() {
        this.graph.updateOptions({file: this.data, labels: this.labels});
      },
    },
    beforeDestroy() {
      this.graph.destroy();
    }
  }
</script>


<style lang="scss" scoped>
  .graph-container {
    height: 100%;
  }
</style>
