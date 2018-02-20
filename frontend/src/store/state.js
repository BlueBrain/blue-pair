
const state = {
  circuit: {
    neurons: [],
    neuronPropIndex: {},
    neuronProps: [],
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
