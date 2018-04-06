
<template>
  <div>
    <neuron-size/>
    <neuron-color/>
    <neuron-selector></neuron-selector>
    <neuron-prop-filter/>
    <hover-neuron-info/>
  </div>
</template>


<script>
  import NeuronSize from './circuit-tab/neuron-size.vue';
  import NeuronPropFilter from './circuit-tab/neuron-prop-filter.vue';
  import NeuronColor from './circuit-tab/neuron-color.vue';
  import NeuronSelector from './circuit-tab/neuron-selector.vue';
  import HoverNeuronInfo from './circuit-tab/hover-neuron-info.vue';

  export default {
    name: 'circuit-tab',
    components: {
      'neuron-size': NeuronSize,
      'neuron-prop-filter': NeuronPropFilter,
      'neuron-color': NeuronColor,
      'neuron-selector': NeuronSelector,
      'hover-neuron-info': HoverNeuronInfo,
    },
  };
</script>
