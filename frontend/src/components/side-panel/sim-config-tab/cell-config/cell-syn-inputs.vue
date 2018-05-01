
<template>
  <div class="container">
    <p class="cta-title">
      Select a pre-synaptic cells to add synapses with Poisson process with given frequency
    </p>

    <Row :gutter="6">
      <i-col span="6">
        <i-select
          size="small"
          placeholder="Prop"
          :transfer="true"
          v-model="ctrl.preSynCellCurrentProp"
          @on-change="updateFilters"
        >
          <i-option
            v-for="prop in ctrl.preSynCellProps"
            :value="prop"
            :key="prop"
          >{{ prop }}</i-option>
        </i-select>
      </i-col>
      <i-col span="10">
        <AutoComplete
          size="small"
          v-model="ctrl.preSynCellPropCurrentValue"
          :data="ctrl.preSynCellPropValues"
          :filter-method="valueFilterMethod"
          :transfer="true"
          placeholder="Value"
        ></AutoComplete>
      </i-col>
      <i-col span="4">
        <InputNumber
          size="small"
          v-model="ctrl.spikeFrequency"
          :min="0.5"
          :max="40"
          :step="0.5"
          placeholder="f, Hz"
        ></InputNumber>
      </i-col>
      <i-col span="4" style="text-align: center">
        <i-button
          size="small"
          long
          type="primary"
          @click="addSynInput"
          :disabled=" !ctrl.preSynCellCurrentProp ||
                      !ctrl.preSynCellPropCurrentValue ||
                      !filterSet[ctrl.preSynCellCurrentProp].includes(ctrl.preSynCellPropCurrentValue) ||
                      !ctrl.spikeFrequency"
        >Add input</i-button>
      </i-col>
    </Row>
    <div class="mt-12">
      <cell-syn-input
        class="syn-input-container"
        v-for="(synInput, index) in synInputs"
        :key="synInput.preSynCellProp + synInput.preSynCellPropVal"
        :syn-input="synInput"
        @on-close="removeSynInput(index)"
      />
    </div>

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
        ctrl: {
          preSynCellProps: [],
          preSynCellCurrentProp: null,
          preSynCellPropValues: [],
          preSynCellPropCurrentValue: null,
          spikeFrequency: null,
        },
        filterSet: {},
        synInputs: [],
        loading: true,
      };
    },
    components: {
      'cell-syn-input': CellSynInput,
    },
    mounted() {
      store.$on('synInputsCtrl:init', () => this.init());
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

        this.ctrl.preSynCellProps = Object.keys(this.filterSet);
        this.updateFilters();

        this.loading = false;
      },
      updateFilters() {
        this.ctrl.preSynCellPropCurrentValue = '';
        if (!this.ctrl.preSynCellCurrentProp) {
          this.ctrl.preSynCellPropValues = [];
          return;
        }

        const currentProp = this.ctrl.preSynCellCurrentProp;
        this.ctrl.preSynCellPropValues = this.filterSet[currentProp]
          .filter(propValue => !this.synInputs.find((input) => {
            return input.preSynCellProp === currentProp && input.preSynCellPropVal === propValue;
          }));
      },
      valueFilterMethod(value, option) {
        return option.toString().toUpperCase().includes(value.toString().toUpperCase());
      },
      addSynInput() {
        this.synInputs.push({
          preSynCellProp: this.ctrl.preSynCellCurrentProp,
          preSynCellPropVal: this.ctrl.preSynCellPropCurrentValue,
          spikeFrequency: this.ctrl.spikeFrequency,
        });

        this.updateFilters();

        store.$dispatch('setSynInputs', this.synInputs);
      },
      removeSynInput(index) {
        this.synInputs.splice(index, 1);
        this.updateFilters();

        store.$dispatch('setSynInputs', this.synInputs);
      },
    },
  };
</script>


<style lang="scss" scoped>
  .container {
    position: relative;
  }
</style>
