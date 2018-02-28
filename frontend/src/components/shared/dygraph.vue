
<template>
  <div class="container" ref="graph"></div>
</template>


<script>
  import Dygraph from 'dygraphs';

  export default {
    name: 'dygraph',
    props: ['config', 'data'],
    mounted() {
      this.graph = new Dygraph(this.$refs.graph, this.data, this.config);
    },
    watch: {
      data() {
        this.graph.updateOptions({file: this.data});
      },
    },
    beforeDestroy() {
      this.graph.destroy();
    }
  }
</script>


<style lang="scss" scoped>
  .container {
    height: 100%;
  }
</style>
