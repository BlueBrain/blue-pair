
import clone from 'lodash/clone';
import some from 'lodash/some';

const getters = {
  neuron(store, index) {
    const { neurons, neuronPropIndex } = store.state.circuit;

    return Object.keys(store.state.circuit.neuronPropIndex)
      .reduce((nrn, prop) => {
        const propValue = neurons[index][neuronPropIndex[prop]];
        return Object.assign(nrn, { [prop]: propValue });
      }, { gid: index + 1 });
  },

  neuronPosition(store, index) {
    const { neurons, neuronPropIndex } = store.state.circuit;

    return [
      neurons[index][neuronPropIndex.x],
      neurons[index][neuronPropIndex.y],
      neurons[index][neuronPropIndex.z],
    ];
  },

  stimuli(store) {
    return clone(store.state.simulation.stimuli);
  },

  recordings(store) {
    return clone(store.state.simulation.recordings);
  },

  isStimulusPresent(store, segment) {
    return some(store.state.simulation.stimuli, s => s.sectionName === segment.sectionName);
  },

  isRecordingPresent(store, segment) {
    return some(store.state.simulation.recordings, r => r.sectionName === segment.sectionName);
  },
};

export default getters;
