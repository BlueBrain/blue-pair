
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
    synapseSize: 6,
    synapsePropIndex: {},
    synapseProps: [],
    synapses: [],
    waitingSecSelection: false,
    morphology: {},
    params: {
      tStop: 400,
      timeStep: 0.025,
    },
    synInputs: [],
    stimuli: [],
    recordings: [],
    traces: [],
  },
};

export default state;
