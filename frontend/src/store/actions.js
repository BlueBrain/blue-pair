
import socket from '@/services/websocket';
import storage from '@/services/storage';
import cloneDeep from 'lodash/cloneDeep';

// TODO: prefix events with target component's names


const actions = {
  async loadCircuit(store) {
    let neuronDataSet = await storage.getItem('neuronData');
    if (!neuronDataSet) {
      store.$emit('showSpinner', 'Loading circuit');
      neuronDataSet = await socket.request('get_circuit_cells');
      storage.setItem('neuronData', neuronDataSet);
      store.$emit('hideSpinner');
    }

    store.state.circuit.neuronProps = neuronDataSet.properties;

    store.state.circuit.neuronPropIndex = neuronDataSet.properties
      .reduce((propIndexObj, propName, propIndex) => {
        return Object.assign(propIndexObj, {
          [propName]: propIndex,
        });
      }, {});

    store.state.circuit.neurons = neuronDataSet.data;

    const neuronsCount = store.state.circuit.neurons.length;
    store.state.circuit.globalFilterIndex = new Array(neuronsCount).fill(true);
    store.state.circuit.connectionFilterIndex = new Array(neuronsCount).fill(true);

    store.$emit('initNeuronColor');
    store.$emit('initNeuronPropFilter');
    store.$emit('circuitLoaded');
  },

  circuitColorUpdated(store) {
    store.$emit('redrawCircuit');
    store.$emit('updateColorPalette');
  },

  connectionFilterUpdated(store) {
    store.$emit('redrawCircuit');
  },

  updateHoveredNeuron(store, neuron) {
    store.$emit('updateHoveredNeuron', neuron);
  },

  propFilterUpdated(store) {
    store.$emit('redrawCircuit');
  },

  colorUpdated(store) {
    store.$emit('updateColorPalette');
    store.$emit('redrawCircuit');
  },

  setPointNeuronSize(store, size) {
    store.$emit('setPointNeuronSize', size);
  },

  updateSelectedNeuron(store) {
    store.$emit('updateSelectedNeuron');
  },

  neuronAddedToSim(store, neuron) {
    store.$emit('neuronAddedToSim', neuron);
  },

  neuronRemovedFromSim(store, neuron) {
    store.$emit('neuronRemovedFromSim', neuron);
  },

  morphSegmentClicked(store, segment) {
    store.$emit('morphSegmentSelected', segment);
  },

  paletteKeyHover(store, paletteKey) {
    store.$emit('addTmpGlobalFilter', {
      prop: store.state.circuit.color.neuronProp,
      val: paletteKey,
    });
  },

  runSim(store, cellConfigs) {
    socket.send('get_sim_traces', { cells: cellConfigs });
  },

  paletteKeyUnhover(store) {
    store.$emit('removeTmpGlobalFilter');
  },

  circuitTabSelected(store) {
    store.$emit('resetSimConfigBtn');
    store.$emit('showCircuit');
    store.$emit('removeCellMorphology');
  },

  async loadMorphology(store) {
    store.$emit('updateSimCellConfig', store.state.circuit.simAddedNeurons);
    const gids = store.state.circuit.simAddedNeurons.map(n => n.gid);

    const synConnectionsRaw = await socket.request('get_syn_connections', gids);
    store.state.simulation.synConnections = synConnectionsRaw.connections;

    const cachedGids = Object.keys(store.state.simulation.morphology);
    const gidsToLoad = gids.filter(gid => !cachedGids.includes(gid));
    const morphObj = await socket.request('get_cell_morphology', gidsToLoad);

    // TODO: add cache with TTL to clear memory in long run
    Object.assign(store.state.simulation.morphology, morphObj.cells);
    const simNeurons = cloneDeep(store.state.circuit.simAddedNeurons);
    store.$emit('updateSimCellConfig', simNeurons);
    store.$emit('showCellMorphology');
    store.$emit('hideCircuit');
    store.$emit('showSynConnections');
    store.$emit('setSimulationConfigTabActive');
  },
};

export default actions;
