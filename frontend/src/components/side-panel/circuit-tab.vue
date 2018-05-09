
<template>
  <div>
    <neuron-selector></neuron-selector>
    <neuron-prop-filter/>
  </div>
</template>


<script>
  import NeuronPropFilter from './circuit-tab/neuron-prop-filter.vue';
  import NeuronSelector from './circuit-tab/neuron-selector.vue';

  export default {
    name: 'circuit-tab',
    components: {
      'neuron-prop-filter': NeuronPropFilter,
      'neuron-selector': NeuronSelector,
    },
  };
</script>
