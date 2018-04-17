
import socket from '@/services/websocket';
import storage from '@/services/storage';
import cloneDeep from 'lodash/cloneDeep';
import remove from 'lodash/remove';

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

  showGlobalSpinner(store, msg) {
    store.$emit('showGlobalSpinner', msg);
  },

  hideGlobalSpinner(store) {
    store.$emit('hideGlobalSpinner');
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

  setSynapseSize(store, size) {
    store.$emit('setSynapseSize', size);
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

  setWaitingSecSelection(store, val) {
    store.state.simulation.waitingSecSelection = val;
  },

  morphSegmentClicked(store, context) {
    const segment = context.data;
    store.$emit('morphSegmentSelected', segment);

    if (!store.state.simulation.waitingSecSelection) store.$emit('showMorphSegmentPoptip', context);
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
    // store.$dispatch('showGlobalSpinner', 'Waiting for simulation backend to be ready...');

    store.$once('ws:backend_ready', () => {
      store.$dispatch('showGlobalSpinner', 'Initializing simulation...');
    });

    store.$once('ws:simulation_result', () => store.$dispatch('hideGlobalSpinner'));

    const gids = store.state.circuit.simAddedNeurons.map(n => n.gid);

    const simConfig = {
      gids,
      tStop: store.state.simulation.params.tStop,
      timeStep: store.state.simulation.params.timeStep,
      stimuli: store.state.simulation.stimuli,
      recordings: store.state.simulation.recordings,
    };

    socket.send('get_sim_traces', simConfig);
  },

  updateGlobalSimParams(store, params) {
    Object.assign(store.state.simulation.params, params);
  },

  circuitTabSelected(store) {
    store.$emit('resetSimConfigBtn');
    store.$emit('showCircuit');
    store.$emit('removeCellMorphology');
    store.$emit('setBottomPanelMode', 'cellSelection');
  },

  addStimulus(store, segment) {
    store.state.simulation.stimuli.push({
      gid: segment.gid,
      sectionName: segment.sectionName,
      type: 'step',
      delay: 100,
      duration: 400,
      current: 0.7,
      stopCurrent: 0.2,
    });
    store.$emit('addSecMarker', {
      type: 'stimulus',
      gid: segment.gid,
      sectionName: segment.sectionName,
    });
    store.$emit('updateStimuli');
  },

  removeStimulus(store, stimulus) {
    remove(store.state.simulation.stimuli, s => s.sectionName === stimulus.sectionName);
    store.$emit('removeSecMarker', {
      type: 'stimulus',
      gid: stimulus.gid,
      sectionName: stimulus.sectionName,
    });
    store.$emit('updateStimuli');
  },

  addRecording(store, segment) {
    store.state.simulation.recordings.push({
      gid: segment.gid,
      sectionName: segment.sectionName,
    });
    store.$emit('addSecMarker', {
      type: 'recording',
      gid: segment.gid,
      sectionName: segment.sectionName,
    });
    store.$emit('updateRecordings');
  },

  removeRecording(store, recording) {
    remove(store.state.simulation.recordings, r => r.sectionName === recording.sectionName);
    store.$emit('removeSecMarker', {
      type: 'recording',
      gid: recording.gid,
      sectionName: recording.sectionName,
    });
    store.$emit('updateRecordings');
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
