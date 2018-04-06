
<template>
  <Card>
    <Row>
      <i-col>
        <h4 class="title">
          Cells added for simulation:
          <span
            class="title-message"
            v-if="!simAddedNeurons.length && !selectedNeuron"
          >Pick a cell</span>
        </h4>
        <div class="gid-list-container">
          <Tag
            v-for="neuron in simAddedNeurons"
            :key="neuron.gid"
            color="blue"
            closable
            @click.native="onNeuronClick"
            @on-close="onNeuronRemove(neuron)"
          >
            <strong>gid: </strong> {{ neuron.gid }}
          </Tag>
          <Button
            icon="ios-plus-empty"
            type="dashed"
            size="small"
            v-if="selectedNeuron"
            @click="onNeuronAdd(selectedNeuron)"
          >
            <strong>gid: </strong> {{ selectedNeuron.gid }}
          </Button>
        </div>
      </i-col>
    </Row>

    <div class="separator"></div>

    <neuron-connection-filter/>

    <br>

    <Row :gutter="6">
      <i-col
        span="4"
        push="20"
      >
        <i-button
          size="small"
          type="primary"
          long
          :disabled="simAddedNeurons.length < 2"
          :loading="simInit"
          @click="onConfigureSimulationBtnClick"
        >Sim config</i-button>
      </i-col>
    </Row>
  </Card>
</template>


<script>
  import store from '@/store';
  import NeuronConnectionFilter from './neuron-connection-filter.vue';

  export default {
    name: 'neuron-selector',
    components: {
      'neuron-connection-filter': NeuronConnectionFilter,
    },
    data() {
      return {
        selectedNeuron: store.state.circuit.selectedNeuron,
        simAddedNeurons: store.state.circuit.simAddedNeurons,
        simInit: false,
      };
    },
    mounted() {
      store.$on('updateSelectedNeuron', () => {
        this.selectedNeuron = store.state.circuit.selectedNeuron;
      });
      store.$on('resetSimConfigBtn', () => { this.simInit = false; });
    },
    methods: {
      onNeuronAdd(neuron) {
        this.simAddedNeurons.push(neuron);
        this.selectedNeuron = null;
        // TODO: move logic below to store action
        store.state.circuit.simAddedNeurons = this.simAddedNeurons;
        store.state.circuit.selectedNeuron = null;
        store.$dispatch('neuronAddedToSim', neuron.gid);
      },
      onNeuronRemove(neuron) {
        this.simAddedNeurons = this.simAddedNeurons.filter(nrn => nrn.gid !== neuron.gid);
        // TODO: move logic below to store action
        store.state.circuit.simAddedNeurons = this.simAddedNeurons;
        store.$dispatch('neuronRemovedFromSim', neuron.gid);
      },
      onConfigureSimulationBtnClick() {
        this.simInit = true;
        store.$dispatch('loadMorphology');
      },
    },
  };
</script>


<style scoped lang="scss">
  .title {
    margin-bottom: 6px;
  }

  .title-message {
    font-weight: normal;
    font-size: 12px;
    color: #888888;
    margin-left: 6px;
  }

  .gid-list-container {
    min-height: 24px;
  }

  .ivu-card {
    margin-bottom: 12px;
  }

  .ivu-tag {
    margin: 1px 6px 1px 0;
  }

  .separator {
    border-top: 1px solid #dddee1;
    margin: 16px 0;
  }
</style>
