
// TODO: write documentation

const state = {
  circuit: {
    neurons: [],
    neuronPropIndex: {},
    neuronProps: [],
    somaSize: 10,
    globalFilterIndex: [],
    connectionFilterIndex: [],
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
