
<template>
  <div>
    <transition name="fade">
      <Card v-if="table.data.length && visible">
        <i-table
          :columns="table.columns"
          :data="table.data"
          :show-header="false"
          size="small"
        ></i-table>
      </Card>
    </transition>
  </div>
</template>


<script>
  import store from '@/store';

  export default {
    name: 'hover-neuron-info',
    data() {
      return {
        visible: false,
        table: {
          columns: [{
            key: 'property',
            width: 128,
          }, {
            key: 'value',
            ellipsis: true,
          }],
          data: [],
        },
      };
    },
    mounted() {
      store.$on('showHoveredNeuronInfo', (neuron) => {
        this.table.data.forEach((propObj) => {
          propObj.value = neuron ? neuron[propObj.property] : '';
        });
        this.visible = true;
      });

      store.$on('hideHoveredNeuronInfo', () => { this.visible = false; });

      store.$on('circuitLoaded', () => {
        this.table.data = store.state.circuit.neuronProps.map(prop => ({ property: prop, value: '' }));
      });
    },
  };
</script>


<style lang="scss">
  .ivu-table-small td {
    height: 22px;
  }
</style>
