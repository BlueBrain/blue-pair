
<template>
  <div class="container">
    <p class="cta-title">
      Select a pre-synaptic cells to add synapses with Poisson process with given frequency
    </p>

    <div
      class="mt-12"
      v-for="(synInputs, gid) of synInputsByGid"
      :key="gid"
    >
      <gid-label :gid="gid"/>

      <div
        class="mt-6"
        v-for="(synInput, index) in synInputs"
        :key="synInput.id"
      >
        <cell-syn-input
          class="syn-input-container"
          v-model="synInputs[index]"
          :filter-set="filterSet"
          @on-close="removeSynInput(synInput)"
          @input="onSynInputChange(synInput)"
        />
      </div>
    </div>

    <cell-syn-input
      class="syn-input-container mt-6"
      v-if="tmpSynInput"
      v-model="tmpSynInput"
      :filter-set="filterSet"
      @on-close="removeTmpSynInput()"
    />

    <i-button
      class="mt-12"
      size="small"
      @click="addTmpSynInput()"
    >
      Add synaptic input
    </i-button>

    <!-- TODO: reset loading state when switching tab to circuit -->
    <Spin size="large" fix v-if="loading"></Spin>
  </div>
</template>


<script>
  import groupBy from 'lodash/groupBy';
  import store from '@/store';
  import GidLabel from '@/components/shared/gid-label.vue';
  import CellSynInput from './cell-syn-input.vue';

  export default {
    name: 'cell-syn-inputs',
    data() {
      return {
        filterSet: {},
        synInputsByGid: {},
        tmpSynInput: null,
        loading: true,
      };
    },
    components: {
      'cell-syn-input': CellSynInput,
      'gid-label': GidLabel,
    },
    mounted() {
      store.$on('synInputsCtrl:init', () => this.init());
      store.$on('updateSynInputs', () => {
        this.synInputsByGid = groupBy(store.$get('synInputs'), synInput => synInput.gid);
      });
      store.$on('addSynInput', gid => this.addSynInput(gid));
      store.$on('morphSectionSelected', (section) => {
        if (!this.tmpSynInput) return;

        store.$dispatch('addSynInput', section.neuron.gid);
        this.tmpSynInput = null;
        this.updateWaitingSecSelection();
      });
    },
    methods: {
      init() {
        this.synInputs = [];

        const { synapses } = store.state.simulation;
        const { neurons, neuronProps } = store.state.circuit;
        const neuronSample = neurons[0];

        this.filterSet = neuronProps.reduce((filterSet, propName, propIndex) => {
          const filterPropsToSkip = ['x', 'y', 'z'];
          if (filterPropsToSkip.includes(propName)) return filterSet;

          const propType = typeof neuronSample[propIndex];
          if (propType !== 'string' && propType !== 'number') return filterSet;

          const propUniqueValues = Array.from(new Set(synapses.map(synapse => neurons[synapse.preGid - 1][propIndex])));
          if (propUniqueValues.length > 200) return filterSet;

          return Object.assign(filterSet, { [propName]: propUniqueValues.sort() });
        }, {});

        this.filterSet.gid = store.state.circuit.simAddedNeurons.map(n => n.gid);

        this.loading = false;
      },
      onSynInputChange(synInput) {
        store.$dispatch('updateSynInput', synInput);
      },
      addTmpSynInput() {
        this.tmpSynInput = {
          gid: null,
          id: Date.now(),
          valid: false,
          visible: true,
          preSynCellProp: null,
          preSynCellPropVal: null,
          spikeFrequency: 10,
        };

        this.updateWaitingSecSelection();
      },
      removeTmpSynInput() {
        this.tmpSynInput = null;
        this.updateWaitingSecSelection();
      },
      removeSynInput(synInput) {
        store.$dispatch('removeSynInput', synInput);
      },
      updateWaitingSecSelection() {
        store.$dispatch('setWaitingSecSelection', !!this.tmpSynInput);
      },
    },
  };
</script>


<style lang="scss" scoped>
  .container {
    position: relative;
  }
</style>
