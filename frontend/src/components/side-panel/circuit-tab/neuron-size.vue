
<template>
  <Card>
    <i-form :label-width="120" label-position="left">
      <FormItem label="Point neuron size">
        <Slider
          :min="5"
          :max="30"
          :step="1"
          :value="size"
          @input="setPointNeuronSize"
          show-input
        ></Slider>
      </FormItem>
    </i-form>
  </Card>
</template>


<script>
  import store from '@/store';

  export default {
    name: 'neuron-size',
    data() {
      return {size: store.state.circuit.pointNeuronSize};
    },
    methods: {
      setPointNeuronSize(size) {
        store.$dispatch('setPointNeuronSize', size);
      }
    },
  };
</script>


<style lang="scss" scoped>
  .ivu-card {
    margin-bottom: 12px;
  }

  .ivu-form-item {
    margin-bottom: 0;
  }
</style>

