
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
    synapseSize: 3,
    waitingSecSelection: false,
    morphology: {},
    params: {
      tStop: 400,
      timeStep: 0.025,
    },
    stimuli: [],
    recordings: [],
    traces: [],
  },
};

export default state;
