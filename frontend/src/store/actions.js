import socket from '@/services/websocket';
import storage from '@/services/storage';


const actions = {
  async loadCircuit(store) {
    let neuronDataSet = await storage.getItem('neuronData');
    if (!neuronDataSet) {
      neuronDataSet = await socket.request('neuronDataSet');
      storage.setItem('neuronData', neuronData);
    }

    store.state.circuit.neuronProps = neuronDataSet.columns;

    store.state.circuit.neuronPropIndex = neuronDataSet.columns
      .reduce((propIndexObj, propName, propIndex) => {
        return Object.assign(propIndexObj, {
          [propName]: propIndex
        });
      }, {});

    store.state.circuit.neurons = neuronDataSet.data

    const neuronsCount = store.state.circuit.neurons.length;
    store.state.circuit.globalFilterIndex = new Array(neuronsCount).fill(true);
    store.state.circuit.connectionFilterIndex = new Array(neuronsCount).fill(true);
    store.$emit('initNeuronColor');
    store.$emit('initNeuronPropFilter');
    store.$emit('circuitLoaded');
  },

  async loadMorphology(store) {
    const gids = store.state.circuit.simAddedNeurons.map(n => n.gid);
    const cachedGids = Object.keys(store.state.simulation.morphology);
    const gidsToLoad = gids.filter(gid => !cachedGids.includes(gid));
    const morphObj = await socket.request('get_sec_info', gidsToLoad);
    // TODO: add cache with TTL to clear memory in long run
    Object.assign(store.state.simulation.morphology, morphObj.cells);
    store.$emit('setSimulationTabActive');
    store.$emit('showCellMorphology');
  },
};

export default actions;
