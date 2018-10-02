
import clone from 'lodash/clone';
import some from 'lodash/some';


function isSectionOfInteractionSite(interactionSite, section) {
  return interactionSite.sectionName === section.name &&
    interactionSite.gid === section.neuron.gid;
}

const getters = {
  neuron(store, index) {
    const { neurons, neuronPropIndex } = store.state.circuit;

    return Object.keys(neuronPropIndex)
      .reduce((nrn, prop) => {
        const propValue = neurons[index][neuronPropIndex[prop]];
        return Object.assign(nrn, { [prop]: propValue });
      }, { gid: index + 1 });
  },

  synapse(store, synapseIndex) {
    return store.state.simulation.synapses[synapseIndex];
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

  synInputs(store) {
    return clone(store.state.simulation.synInputs);
  },

  recordings(store) {
    return clone(store.state.simulation.recordings);
  },

  isStimulusPresent(store, section) {
    return some(store.state.simulation.stimuli, s => isSectionOfInteractionSite(s, section));
  },

  isRecordingPresent(store, section) {
    return some(store.state.simulation.recordings, r => isSectionOfInteractionSite(r, section));
  },
};


export default getters;
