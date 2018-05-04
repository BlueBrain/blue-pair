
<template>
  <div class="container">
    <p class="cta-title">
      Select a pre-synaptic cells to add synapses with Poisson process with given frequency
    </p>

    <div class="mt-12">
      <cell-syn-input
        class="syn-input-container"
        v-for="(synInput, index) in synInputs"
        :key="synInput.id"
        v-model="synInputs[index]"
        :filter-set="filterSet"
        @on-close="removeSynInput(index)"
      />
    </div>

    <cell-syn-input
      class="syn-input-container"
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
  import store from '@/store';
  import CellSynInput from './cell-syn-input.vue';

  export default {
    name: 'cell-syn-inputs',
    data() {
      return {
        filterSet: {},
        synInputs: {},
        tmpSynInput: null,
        loading: false,
      };
    },
    components: {
      'cell-syn-input': CellSynInput,
    },
    mounted() {
      store.$on('synInputsCtrl:init', () => this.init());
      store.$on('addSynInput', gid => this.addSynInput(gid));
      store.$on('morphSegmentSelected', (segment) => {
        if (!this.tmpSynInput) return;

        this.tmpSynInput.gid = segment.neuron.gid;

        this.synInputs.push(this.tmpSynInput);
        this.removeTmpSynInput();
        store.$dispatch('setSynInputs', this.synInputs);
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

        this.loading = false;
      },
      addSynInput(gid) {
        this.synInputs.push({
          gid,
          preSynCellProp: null,
          preSynCellPropVal: null,
          spikeFrequency: 10,
          id: Date.now(),
        });
      },
      addTmpSynInput() {
        this.tmpSynInput = {
          gid: null,
          preSynCellProp: null,
          preSynCellPropVal: null,
          spikeFrequency: 10,
          id: Date.now(),
        };

        this.updateWaitingSecSelection();
      },
      removeSynInput(index) {
        this.synInputs.splice(index, 1);

        store.$dispatch('setSynInputs', this.synInputs);
      },
      removeTmpSynInput() {
        this.tmpSynInput = null;
        this.updateWaitingSecSelection();
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
