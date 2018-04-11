
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
      .reduce((propIndexObj, propName, propIndex) => Object.assign(propIndexObj, {
        [propName]: propIndex,
      }), {});

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

    if (neuron) {
      store.$emit('highlightSimAddedNeuron', neuron);
    } else {
      store.$emit('unhighlightSimAddedNeuron');
    }
  },

  propFilterUpdated(store) {
    store.$emit('redrawCircuit');
  },

  colorUpdated(store) {
    store.$emit('updateColorPalette');
    store.$emit('redrawCircuit');
  },

  setSomaSize(store, size) {
    store.$emit('setSomaSize', size);
  },

  neuronClicked(store, neuron) {
    store.$emit('addNeuronToSim', neuron);
  },

  neuronAddedToSim(store, neuron) {
    store.$emit('neuronAddedToSim', neuron);
  },

  neuronRemovedFromSim(store, neuron) {
    store.$emit('neuronRemovedFromSim', neuron);
  },

  simNeuronHovered(store, gid) {
    store.$emit('highlightCircuitSoma', gid);
  },

  simNeuronUnhovered(store) {
    store.$emit('removeCircuitSomaHighlight');
  },

  morphSegmentClicked(store, segment) {
    store.$emit('morphSegmentSelected', segment);
  },

  secRecordingAdded(store, config) {
    store.$emit('addSecMarker', Object.assign({}, config, { type: 'recording' }));
  },

  secRecordingRemoved(store, config) {
    store.$emit('removeSecMarker', Object.assign({}, config, { type: 'recording' }));
  },

  secInjectionAdded(store, config) {
    store.$emit('addSecMarker', Object.assign({}, config, { type: 'injection' }));
  },

  secInjectionRemoved(store, config) {
    store.$emit('removeSecMarker', Object.assign({}, config, { type: 'injection' }));
  },

  paletteKeyHover(store, paletteKey) {
    store.$emit('addTmpGlobalFilter', {
      prop: store.state.circuit.color.neuronProp,
      val: paletteKey,
    });
  },

  paletteKeyUnhover(store) {
    store.$emit('removeTmpGlobalFilter');
  },

  simConfigNeuronHovered(store, gid) {
    store.$emit('highlightMorphCell', gid);
  },

  simConfigNeuronUnhovered(store) {
    store.$emit('unhighlightMorphCell');
  },

  runSim(store) {
    store.$emit('setStatus', { message: 'Runnig simulation' });
    socket.send('get_sim_traces', {
      cells: store.state.simulation.cellConfigs,
      globalConfig: store.state.simulation.globalConfig,
    });
  },

  updateGlobalSimConfig(store, config) {
    Object.assign(store.state.simulation.globalConfig, config);
  },

  updateSimCellConfigs(store, cellConfigs) {
    store.state.simulation.cellConfigs = cellConfigs;
  },

  circuitTabSelected(store) {
    store.$emit('resetSimConfigBtn');
    store.$emit('showCircuit');
    store.$emit('removeCellMorphology');
    store.$emit('setBottomPanelMode', 'cellSelection');
  },

  async loadMorphology(store) {
    store.$emit('updateSimCellConfig', store.state.circuit.simAddedNeurons);
    const gids = store.state.circuit.simAddedNeurons.map(n => n.gid);

    const cachedGids = Object.keys(store.state.simulation.morphology);
    const gidsToLoad = gids.filter(gid => !cachedGids.includes(gid));

    const morphKey = `morph:${gidsToLoad.sort().join('-')}`;

    // TODO: add cache with TTL to clear memory and localstorage in a long run
    let morphObj = await storage.getItem(morphKey);
    if (!morphObj) {
      store.$emit('setStatus', { message: 'Getting cell morphologies' });
      morphObj = await socket.request('get_cell_morphology', gidsToLoad);
      storage.setItem(morphKey, morphObj);
    }

    Object.assign(store.state.simulation.morphology, morphObj.cells);

    const simNeurons = cloneDeep(store.state.circuit.simAddedNeurons);
    store.$emit('updateSimCellConfig', simNeurons);
    store.$emit('setBottomPanelMode', 'simulationConfig');
    store.$emit('showCellMorphology');
    store.$emit('hideCircuit');
    store.$emit('setSimulationConfigTabActive');

    store.$emit('setStatus', { message: 'Getting synapses' });
    const synConnectionsRaw = await socket.request('get_syn_connections', gids);
    /**
     * @desc Array of synaptic connections between given cells.
     * synConnections = [
     *   [
     *     Synapse.POST_X_CENTER,
     *     Synapse.POST_Y_CENTER,
     *     Synapse.POST_Z_CENTER,
     *     Synapse.TYPE,
     *     Synapse.PRE_GID,
     *     Synapse.PRE_SECTION_ID,
     *     Synapse.POST_GID,
     *     Synapse.POST_SECTION_ID
     *   ],
     *   ...
     * ]
     */
    store.state.simulation.synConnections = synConnectionsRaw.connections;

    store.$emit('setStatus', { message: 'Ready' });
    store.$emit('showSynConnections');
  },
};

export default actions;
