
<template>
  <Card>
    <h4 class="title">
      Neuron set examples:
    </h4>

    <Row :gutter="6">
      <i-col span="20">
        <i-select
          size="small"
          placeholder="Pick an example set of neurons"
          :transfer="true"
          v-model="currentNeuronSetIndex"
        >
          <i-option
            v-for="(neuronSet, index) in neuronSets"
            :value="index"
            :key="index"
          >{{ neuronSet.label }}</i-option>
        </i-select>
      </i-col>
      <i-col span="4" style="text-align: center">
        <i-button
          size="small"
          long
          type="primary"
          disabled
        >Load</i-button>
      </i-col>
    </Row>
  </Card>
</template>


<script>
  import store from '@/store';

  export default {
    name: 'neuron-set-examples',
    data() {
      return {
        currentNeuronSetIndex: null,
        neuronSets: [{
          key: 'martinotiLoop',
          label: 'Martinoti loop',
          gids: [100, 200, 300],
        }, {
          key: 'martinotiLoop2',
          label: 'Martinoti loop 2',
          gids: [102, 202, 303],
        }],
      };
    },
    methods: {
      loadNeuronSet() {
        const { gids } = this.neuronSets[this.currentNeuronSetIndex];
        store.$dispatch('loadNeuronSetClicked', { gids });
      },
    },
  };
</script>


<style lang="scss" scoped>
  .title {
    margin-bottom: 12px;
  }
</style>
