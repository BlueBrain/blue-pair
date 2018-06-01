
// TODO: write documentation

const state = {
  circuit: {
    neurons: [],
    neuronPropIndex: {},
    neuronProps: [],
    neuronCount: null,
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
    running: false,
    synapseSize: 5,
    synapsePropIndex: {},
    synapseProps: [],
    synapses: [],
    waitingSecSelection: false,
    morphology: {},
    params: {
      tStop: 400,
      timeStep: 0.05,
      forwardSkip: 5000,
    },
    synInputs: [],
    stimuli: [],
    recordings: [],
  },
};

export default state;
