
const getters = {
  neuron(store, index) {
    const neurons = store.state.circuit.neurons;
    const neuronPropIndex = store.state.circuit.neuronPropIndex;

    return Object.keys(store.state.circuit.neuronPropIndex)
      .reduce((nrn, prop) => {
        const propValue = neurons[index][neuronPropIndex[prop]];
        return Object.assign(nrn, {
          [prop]: propValue,
        });
      }, { gid: index + 1 });
  },

  neuronPosition(store, index) {
    const neurons = store.state.circuit.neurons;
    const propIndex = store.state.circuit.neuronPropIndex;

    return [
      neurons[index][propIndex.x],
      neurons[index][propIndex.y],
      neurons[index][propIndex.z],
    ];
  },
};

export default getters;
