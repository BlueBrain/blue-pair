
import cloneDeep from 'lodash/cloneDeep';
import remove from 'lodash/remove';
import pickBy from 'lodash/pickBy';
import pick from 'lodash/pick';
import groupBy from 'lodash/groupBy';

import isEqualBy from '@/tools/is-equal-by.js';

import socket from '@/services/websocket';
import storage from '@/services/storage';

// TODO: prefix events with target component's names

const recAndInjCompareKeys = ['sectionName', 'gid'];


const actions = {
  async loadCircuit(store) {
    const { circuit } = store.state;
    const neuronDataSet = await storage.getItem('neuronData');

    if (neuronDataSet) {
      circuit.neuronProps = neuronDataSet.properties;
      circuit.neurons = neuronDataSet.data;
      store.$dispatch('initCircuit');
      return;
    }

    store.$emit('showCircuitLoadingModal');

    store.$once('ws:circuit_cell_info', (info) => {
      circuit.neuronCount = info.count;
      circuit.neuronProps = info.properties;
    });

    store.$on('ws:circuit_cells_data', (cellData) => {
      circuit.neurons.push(...cellData);
      const progress = Math.ceil((circuit.neurons.length / circuit.neuronCount) * 100);
      store.$emit('setCircuitLoadingProgress', progress);
      if (circuit.neurons.length === circuit.neuronCount) {
        storage.setItem('neuronData', {
          properties: circuit.neuronProps,
          data: circuit.neurons,
        });
        store.$dispatch('initCircuit');
      }
    });

    socket.request('get_circuit_cells');
  },

  initCircuit(store) {
    store.state.circuit.neuronPropIndex = store.state.circuit.neuronProps
      .reduce((propIndexObj, propName, propIndex) => Object.assign(propIndexObj, {
        [propName]: propIndex,
      }), {});

    const neuronsCount = store.state.circuit.neurons.length;
    store.state.circuit.globalFilterIndex = new Array(neuronsCount).fill(true);
    store.state.circuit.connectionFilterIndex = new Array(neuronsCount).fill(true);

    store.$emit('initNeuronColor');
    store.$emit('initNeuronPropFilter');
    store.$emit('circuitLoaded');
    store.$emit('hideCircuitLoadingModal');
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

  neuronHovered(store, neuron) {
    // we don't need all properties of neuron to be shown,
    // for example x, y, z can be skipped.
    // TODO: move visible property selection to app config page
    const propsToSkip = ['x', 'y', 'z', 'me_combo', 'morphology'];

    store.$emit('showHoverObjectInfo', {
      header: 'Neuron',
      items: [{
        type: 'table',
        data: pickBy(neuron, (val, prop) => !propsToSkip.includes(prop)),
      }],
    });
    store.$emit('highlightSimAddedNeuron', neuron);
  },

  neuronHoverEnded(store) {
    store.$emit('unhighlightSimAddedNeuron');
    store.$emit('hideHoverObjectInfo');
  },

  synapseHovered(store, synapseIndex) {
    const synapse = store.$get('synapse', synapseIndex);
    const neuron = store.$get('neuron', synapse.preGid - 1);
    store.$emit('showHoverObjectInfo', {
      header: 'Synapse',
      items: [{
        type: 'table',
        data: {
          id: `(${synapse.gid}, ${synapse.index})`,
          pre_gid: synapse.preGid,
          post_gid: synapse.gid,
          type: `${synapse.type} (${synapse.type >= 100 ? 'EXC' : 'INH'})`,
        },
      }, {
        subHeader: 'Pre-synaptic cell:',
        type: 'table',
        data: pickBy(neuron, (val, prop) => ['etype', 'mtype'].includes(prop)),
      }],
    });
  },

  synapseHoverEnded(store) {
    store.$emit('hideHoverObjectInfo');
  },

  morphSectionHovered(store, section) {
    store.$emit('showHoverObjectInfo', {
      header: 'Section',
      items: [{
        type: 'table',
        data: {
          section: section.data.name,
          gid: section.data.neuron.gid,
        },
      }, {
        subHeader: 'Cell:',
        type: 'table',
        data: pickBy(section.data.neuron, (val, prop) => ['etype', 'mtype'].includes(prop)),
      }],
    });
  },

  morphSectionHoverEnded(store) {
    store.$emit('hideHoverObjectInfo');
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

  loadNeuronSetClicked(store, options) {
    const { gids } = options;
    const currentNeuronGids = store.state.circuit.simAddedNeurons.map(neuron => neuron.gid);
    currentNeuronGids.forEach((gid) => {
      const neuron = store.$get('neuron', gid - 1);
      store.$emit('removeNeuronFromSim', neuron);
    });

    gids.forEach((gid) => {
      const neuron = store.$get('neuron', gid - 1);
      store.$emit('addNeuronToSim', neuron);
    });
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

  morphRenderFinished(store) {
    store.$emit('setShowAxonBtnActive');
  },

  showAxons(store) {
    store.$emit('showAxons');
    store.state.simulation.view.axonsVisible = true;
  },

  hideAxons(store) {
    store.$emit('hideAxons');
    store.state.simulation.view.axonsVisible = false;
  },

  showAxonsFinished(store) {
    store.$emit('setShowAxonBtnActive');
  },

  hideAxonsFinished(store) {
    store.$emit('setShowAxonBtnActive');
  },

  morphSectionClicked(store, context) {
    const section = context.data;
    if (section.type === 'axon') return;

    if (!store.state.simulation.waitingSecSelection) store.$emit('showMorphSectionPoptip', context);

    store.$emit('morphSectionSelected', section);
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

  simConfigGidLabelHovered(store, gid) {
    store.$emit('highlightMorphCell', gid);
  },

  simConfigGidLabelUnhovered(store) {
    store.$emit('unhighlightMorphCell');
  },

  simConfigSectionLabelHovered(store, gid) {
    store.$emit('highlightMorphCell', gid);
  },

  simConfigSectionLabelUnhovered(store) {
    store.$emit('unhighlightMorphCell');
  },

  runSim(store) {
    const { synapses, synInputs } = store.state.simulation;
    const { neurons, neuronPropIndex } = store.state.circuit;

    const { simulation } = store.state;
    simulation.running = true;
    store.$once('ws:simulation_finish', () => { simulation.running = false; });

    const simSynapsesByPreGid = synInputs.reduce((synConfig, synInput) => {
      const syns = synapses.filter((syn) => {
        if (synInput.preSynCellProp === 'gid') {
          return syn.gid === synInput.gid &&
            synInput.synapseVisible &&
            syn.preGid === synInput.preSynCellPropVal;
        }

        return syn.gid === synInput.gid &&
          synInput.synapsesVisible &&
          synInput.valid &&
          neurons[syn.preGid - 1][neuronPropIndex[synInput.preSynCellProp]] === synInput.preSynCellPropVal;
      });
      const { spikeFrequency, duration, delay } = synInput;
      const synapsesByPreGid = groupBy(syns, 'preGid');
      Object.entries(synapsesByPreGid).forEach(([preGid, cellSynapses]) => {
        synConfig[preGid] = synConfig[preGid] || {
          spikeFrequency,
          duration,
          delay,
          synapses: cellSynapses.map(s => pick(s, ['postGid', 'index'])),
        };
      });
      return synConfig;
    }, {});

    store.$emit('setStatus', { message: 'Runnig simulation' });
    store.$emit('showOnlyTracesPanel');
    store.$emit('resetTraces');

    const gids = store.state.circuit.simAddedNeurons.map(n => n.gid);

    const { params, stimuli, recordings } = store.state.simulation;

    const simConfig = {
      gids,
      tStop: params.tStop,
      timeStep: params.timeStep,
      forwardSkip: params.forwardSkip,
      stimuli,
      recordings,
      synapses: simSynapsesByPreGid,
    };

    socket.send('run_simulation', simConfig);
  },

  cancelSim() {
    socket.send('cancel_simulation');
  },

  updateGlobalSimParams(store, params) {
    Object.assign(store.state.simulation.params, params);
  },

  circuitTabSelected(store) {
    store.$emit('resetSimConfigBtn');
    store.$emit('showCircuit');
    store.$emit('removeCellMorphology');
    store.$emit('setBottomPanelMode', 'cellSelection');

    const { simulation } = store.state;
    if (simulation.running) store.$dispatch('cancelSim');
  },

  addStimulus(store, section) {
    store.state.simulation.stimuli.push({
      gid: section.gid,
      sectionName: section.name,
      sectionType: section.type,
      type: 'step',
      delay: 100,
      duration: 200,
      current: 0.7,
      voltage: -70,
      stopCurrent: 0.2,
      seriesResistance: 0.01,
      frequency: 12,
      width: 5,
    });
    store.$emit('addSecMarker', {
      type: 'stimulus',
      gid: section.gid,
      sectionName: section.name,
      sectionType: section.type,
    });
    store.$emit('updateStimuli');
    store.$emit('openCellConfigPanel', 'stimuli');
  },

  removeStimulus(store, stimulus) {
    remove(store.state.simulation.stimuli, s => isEqualBy(s, stimulus, recAndInjCompareKeys));
    store.$emit('removeSecMarker', {
      type: 'stimulus',
      gid: stimulus.gid,
      sectionName: stimulus.sectionName,
    });
    store.$emit('updateStimuli');
  },

  updateStimulus(store, stimulus) {
    const { stimuli } = store.state.simulation;
    const storeStimulus = stimuli.find(s => isEqualBy(s, stimulus, recAndInjCompareKeys));
    Object.assign(storeStimulus, stimulus);
  },

  addRecording(store, section) {
    const recording = {
      gid: section.gid,
      sectionName: section.name,
      sectionType: section.type,
    };
    store.state.simulation.recordings.push(recording);
    store.$emit('addSecMarker', Object.assign({ type: 'recording' }, recording));
    store.$emit('updateRecordings');
    store.$emit('openCellConfigPanel', 'recordings');
  },

  removeRecording(store, recording) {
    remove(store.state.simulation.recordings, r => isEqualBy(r, recording, recAndInjCompareKeys));
    store.$emit('removeSecMarker', {
      type: 'recording',
      gid: recording.gid,
      sectionName: recording.sectionName,
    });
    store.$emit('updateRecordings');
  },

  addSynInput(store, gid) {
    const defaultSynInput = {
      gid: null,
      id: Date.now(),
      valid: false,
      synapsesVisible: true,
      preSynCellProp: null,
      preSynCellPropVal: null,
      spikeFrequency: 10,
      delay: 100,
      duration: 200,
    };

    const synInput = Object.assign(defaultSynInput, { gid });
    store.state.simulation.synInputs.push(synInput);
    store.$emit('updateSynInputs');
    store.$dispatch('updateSynapseStates');
    store.$emit('openCellConfigPanel', 'synInputs');
  },

  removeSynInput(store, synInput) {
    remove(store.state.simulation.synInputs, i => i.id === synInput.id);
    store.$emit('updateSynInputs');
    store.$dispatch('updateSynapseStates');
  },

  updateSynInput(store, synInput) {
    const originalSynInput = store.state.simulation.synInputs.find(i => i.id === synInput.id);
    Object.assign(originalSynInput, synInput);
    store.$dispatch('updateSynapseStates');
  },

  updateSynapseStates(store) {
    const { neurons, neuronPropIndex } = store.state.circuit;
    const { synInputs } = store.state.simulation;

    store.state.simulation.synapses.forEach((synapse) => {
      synapse.visible = !!synInputs.find((input) => {
        // TODO: make this easy to understand
        if (input.preSynCellProp === 'gid') {
          return synapse.gid === input.gid &&
            input.synapsesVisible &&
            synapse.preGid === input.preSynCellPropVal;
        }

        return synapse.gid === input.gid &&
          input.synapsesVisible &&
          neurons[synapse.preGid - 1][neuronPropIndex[input.preSynCellProp]] === input.preSynCellPropVal;
      });
    });

    store.$emit('updateSynapses');
  },

  async proceedToSimConfigBtnClicked(store) {
    const { simulation: sim } = store.state;

    store.$emit('updateSimCellConfig', store.state.circuit.simAddedNeurons);
    const gids = store.state.circuit.simAddedNeurons.map(n => n.gid);

    await Promise.all(gids.map(async (gid) => {
      if (store.state.simulation.morphology[gid]) return;

      const cellMorph = await storage.getItem(`morph:${gid}`);
      if (cellMorph) store.state.simulation.morphology[gid] = cellMorph;
    }));

    const cachedGids = Object.keys(store.state.simulation.morphology).map(gid => parseInt(gid, 10));

    const gidsToLoad = gids.filter(gid => !cachedGids.includes(gid));
    if (gidsToLoad.length) {
      const morph = await socket.request('get_cell_morphology', gidsToLoad);
      Object.entries(morph.cells).forEach(([, sections]) => {
        let i;
        let currentType;
        sections.forEach((section) => {
          i = section.type === currentType ? i + 1 : 0;
          currentType = section.type;
          section.name = `${section.type}[${i}]`;
        });
      });
      Object.assign(store.state.simulation.morphology, morph.cells);
      gidsToLoad.forEach(gid => storage.setItem(`morph:${gid}`, morph.cells[gid]));
    }

    // update cell-config: remove stimuli, recordings, synaptic inputs
    // for the cells which are have been removed from simulation
    sim.stimuli = sim.stimuli.filter(stimulus => gids.find(gid => gid === stimulus.gid));
    store.$emit('updateStimuli');
    sim.recordings = sim.recordings.filter(recording => gids.find(gid => gid === recording.gid));
    store.$emit('updateRecordings');
    sim.synInputs = sim.synInputs.filter(synInput => gids.find(gid => gid === synInput.gid));
    store.$emit('updateSynInputs');
    store.$emit('resetTraces');
    store.$emit('removeSectionMarkers', sectionMarkerConfig => !gids.find(gid => sectionMarkerConfig.gid === gid));

    store.$emit('removeCellMorphologies', cellMorph => !gids.find(gid => gid === cellMorph.gid));

    const simNeurons = cloneDeep(store.state.circuit.simAddedNeurons);
    store.$emit('updateSimCellConfig', simNeurons);
    store.$emit('setBottomPanelMode', 'simulationConfig');
    store.$emit('showCellMorphology');
    store.$emit('showSectionMarkers');
    store.$emit('hideCircuit');
    store.$emit('setSimulationConfigTabActive');

    store.$dispatch('initSynapses');
  },

  async initSynapses(store) {
    store.$emit('setStatus', { message: 'Getting synapses' });

    const gids = store.state.circuit.simAddedNeurons.map(n => n.gid);

    // remove synapses for gids that are no longer used from memory
    Object.keys(store.state.simulation.synByGid).forEach((gid) => {
      if (!gids.includes(gid)) delete store.state.simulation.synByGid[gid];
    });

    if (!store.state.simulation.synapseProps.length) {
      const synapseProps = await storage.getItem('synapseProps');
      store.state.simulation.synapseProps = synapseProps || [];
    }

    await Promise.all(gids.map(async (gid) => {
      if (store.state.simulation.synByGid[gid]) return;

      const synapses = await storage.getItem(`syn:${gid}`);
      if (synapses) store.state.simulation.synByGid[gid] = synapses;
    }));

    const synGidsToLoad = gids.filter(gid => !store.state.simulation.synByGid[gid]);
    if (synGidsToLoad.length) {
      store.$emit('synInputCtrl:loading');
      const synConnectionsRaw = await socket.request('get_syn_connections', synGidsToLoad);
      const synapseProps = synConnectionsRaw.connection_properties;

      if (!store.state.simulation.synapseProps.length) {
        store.state.simulation.synapseProps = synapseProps;
        storage.setItem('synapseProps', synapseProps);
      }

      const loadedSynByGid = synConnectionsRaw.connections;
      Object.entries(loadedSynByGid).forEach(([gid, synapses]) => {
        storage.setItem(`syn:${gid}`, synapses);
      });
      Object.assign(store.state.simulation.synByGid, loadedSynByGid);
    }

    const { synapseProps, synByGid } = store.state.simulation;

    // TODO: regenerate propIndex only if needed
    const synapsePropIndex = synapseProps
      .reduce((propIndexObj, propName, propIndex) => Object.assign(propIndexObj, {
        [propName]: propIndex,
      }), {});

    /**
     * @description Transform list of synapse values indexed by gid:
     * {
     *   gid0: [[syn0Props...], [syn1Props...], ...],
     *   ...
     * }
     * to list of synapse objects extended with their gids and indexes:
     * [
     *   { gid, index, [prop]: val },
     *   ...
     * ]
     */
    const synapses = gids.reduce((allSynapses, gid) => {
      const extendedSynapses = synByGid[gid].map((synVals, synIndex) => {
        const synObject = synapseProps.reduce((synObj, synProp) => Object.assign(synObj, {
          [synProp]: synVals[synapsePropIndex[synProp]],
        }), {});
        const extendedSynObject = Object.assign(synObject, { gid, index: synIndex });
        return extendedSynObject;
      });
      return allSynapses.concat(extendedSynapses);
    }, []);
    store.state.simulation.synapses = synapses;

    store.$emit('initSynapseCloud', synapses.length);
    store.$dispatch('updateSynapseStates');
    store.$emit('synInputsCtrl:init');
    store.$emit('setStatus', { message: 'Ready' });
  },
};

export default actions;
