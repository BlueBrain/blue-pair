
<template>
  <div>
    <neuron-size/>
    <neuron-color/>
    <neuron-prop-filter/>
    <neuron-selector></neuron-selector>
    <hover-neuron-info/>
  </div>
</template>


<script>
  import NeuronSize from './circuit-tab/neuron-size';
  import NeuronPropFilter from './circuit-tab/neuron-prop-filter';
  import NeuronColor from './circuit-tab/neuron-color';
  import NeuronSelector from './circuit-tab/neuron-selector';
  import HoverNeuronInfo from './circuit-tab/hover-neuron-info';

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
