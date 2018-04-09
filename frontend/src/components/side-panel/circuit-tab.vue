
<template>
  <div>
    <neuron-selector></neuron-selector>
    <neuron-prop-filter/>
    <hover-neuron-info/>
  </div>
</template>


<script>
  import NeuronPropFilter from './circuit-tab/neuron-prop-filter.vue';
  import NeuronSelector from './circuit-tab/neuron-selector.vue';
  import HoverNeuronInfo from './circuit-tab/hover-neuron-info.vue';

  export default {
    name: 'circuit-tab',
    components: {
      'neuron-prop-filter': NeuronPropFilter,
      'neuron-selector': NeuronSelector,
      'hover-neuron-info': HoverNeuronInfo,
    },
  };
</script>
