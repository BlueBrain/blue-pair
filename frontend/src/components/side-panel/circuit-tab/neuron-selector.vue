
<template>
  <Card>
    <Row>
      <i-col>
        <h5>Cells added for simulation:</h5>
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
      </i-col>
    </Row>

    <br>

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
  import NeuronConnectionFilter from './neuron-connection-filter';

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
      store.$on('resetSimConfigBtn', () => this.simInit = false);
    },
    methods: {
      onNeuronAdd(neuron) {
        this.simAddedNeurons.push(neuron);
        this.selectedNeuron = null;
        store.state.circuit.simAddedNeurons = this.simAddedNeurons;
        store.state.circuit.selectedNeuron = null;
        store.$dispatch('neuronAddedToSim', neuron.gid);
      },
      onNeuronRemove(neuron) {
        this.simAddedNeurons = this.simAddedNeurons.filter(nrn => nrn.gid !== neuron.gid);
        store.state.circuit.simAddedNeurons = this.simAddedNeurons;
        store.$dispatch('neuronRemovedFromSim', neuron.gid);
      },
      onNeuronClick(neuron) {},
      onConfigureSimulationBtnClick() {
        this.simInit = true;
        store.$dispatch('loadMorphology');
      },
    },
  };
</script>


<style scoped lang="scss">
  .ivu-card {
    margin-top: 12px;
    margin-bottom: 12px;
  }
</style>
