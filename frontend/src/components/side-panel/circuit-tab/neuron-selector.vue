
<template>
  <Card>
    <Row>
      <i-col>
        <h4 class="title">
          Cells added for simulation:
          <span
            class="title-message"
            v-if="!simAddedNeurons.length"
          >Pick a cell</span>
        </h4>
        <div class="gid-list-container">
          <Poptip
            trigger="hover"
            placement="left-start"
            :transfer="true"
            width="540"
            v-for="neuron in simAddedNeurons"
            :key="neuron.gid"
          >
            <Tag
              :color="highlightedNeuronGid === neuron.gid ? 'yellow' : 'blue'"
              closable
              @mouseover.native="onNeuronHover(neuron.gid)"
              @mouseleave.native="onNeuronHoverStop()"
              @on-close="onNeuronRemove(neuron)"
            >
              <strong>gid: </strong> {{ neuron.gid }}
            </Tag>
            <div slot="content">
              <neuron-info :neuron="neuron"/>
            </div>
          </Poptip>
        </div>
      </i-col>
    </Row>

    <div class="separator"></div>

    <neuron-connection-filter/>

    <br>

    <Row :gutter="6">
      <i-col
        span="8"
        push="16"
      >
        <i-button
          size="small"
          type="primary"
          long
          :disabled="!simAddedNeurons.length"
          :loading="simInit"
          @click="onConfigureSimulationBtnClick"
        >Proceed to simulation config</i-button>
      </i-col>
    </Row>
  </Card>
</template>


<script>
  import store from '@/store';
  import NeuronConnectionFilter from './neuron-connection-filter.vue';
  import NeuronInfo from '@/components/shared/neuron-info.vue';

  export default {
    name: 'neuron-selector',
    components: {
      'neuron-connection-filter': NeuronConnectionFilter,
      'neuron-info': NeuronInfo,
    },
    data() {
      return {
        simAddedNeurons: store.state.circuit.simAddedNeurons,
        simInit: false,
        highlightedNeuronGid: null,
      };
    },
    mounted() {
      store.$on('addNeuronToSim', neuron => this.onNeuronAdd(neuron));
      store.$on('removeNeuronFromSim', neuron => this.onNeuronRemove(neuron));
      store.$on('resetSimConfigBtn', () => { this.simInit = false; });
      store.$on('highlightSimAddedNeuron', (neuron) => { this.highlightedNeuronGid = neuron.gid; });
      store.$on('unhighlightSimAddedNeuron', () => { this.highlightedNeuronGid = null; });
    },
    methods: {
      onNeuronAdd(neuron) {
        if (this.simAddedNeurons.find(nrn => nrn.gid === neuron.gid)) return;

        this.simAddedNeurons.push(neuron);
        // TODO: move logic below to store action
        store.state.circuit.simAddedNeurons = this.simAddedNeurons;
        store.$dispatch('neuronAddedToSim', neuron.gid);
      },
      onNeuronRemove(neuron) {
        // removed element will not receive mouseleave event,
        // so emitting event manually to remove soma highlight in viewport
        this.onNeuronHoverStop();

        this.simAddedNeurons = this.simAddedNeurons.filter(nrn => nrn.gid !== neuron.gid);
        // TODO: move logic below to store action
        store.state.circuit.simAddedNeurons = this.simAddedNeurons;
        store.$dispatch('neuronRemovedFromSim', neuron.gid);
      },
      onConfigureSimulationBtnClick() {
        this.simInit = true;
        store.$dispatchAsync('proceedToSimConfigBtnClicked');
      },
      onNeuronHover(gid) {
        store.$dispatch('simNeuronHovered', gid);
      },
      onNeuronHoverStop() {
        store.$dispatch('simNeuronUnhovered');
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
