
<template>
  <div class="synapse-size-ctrl-container">
    <vue-slider
      direction="btt"
      tooltip="hover"
      :height="200"
      :width="3"
      :dot-size="12"
      :real-time="true"
      :min="10"
      :max="30"
      :interval="1"
      :value="size"
      @change="setSynapseSize"
    />
  </div>
</template>


<script>
  import VueSlider from 'vue-slider-component';

  import store from '@/store';

  export default {
    name: 'synapse-size-ctrl',
    data() {
      return { size: store.state.simulation.synapseSize };
    },
    components: {
      'vue-slider': VueSlider,
    },
    methods: {
      setSynapseSize(size) {
        store.$dispatch('setSynapseSize', size);
      },
    },
  };
</script>


<style lang="scss" scoped>
  .synapse-size-ctrl-container {
    padding: 12px 6px;
    background-color: white;
    border: 1px solid #dddee1;
    border-radius: 4px;

    &:hover {
      box-shadow: 0 1px 6px rgba(202, 69, 69, 0.2);
    }
  }
</style>
