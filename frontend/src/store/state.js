
// TODO: write documentation

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
    globalConfig: {
      tStop: 400,
      timeStep: 0.025,
    },
    cellConfigs: [],
  },
};

export default state;
