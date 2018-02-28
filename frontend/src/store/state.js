
const state = {
  circuit: {
    neurons: [],
    neuronPropIndex: {},
    neuronProps: [],
    pointNeuronSize: 10,
    globalFilterIndex: [],
    connectionFilterIndex: [],
    selectedNeuron: null,
    simAddedNeurons: [],
    color: {
      neuronProp: '',
      palette: {},
    },
  },
  simulation: {
    morphology: {},
  },
};

export default state;
