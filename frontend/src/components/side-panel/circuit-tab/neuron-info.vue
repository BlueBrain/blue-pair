
<template>
  <Card v-if="table.data.length">
    <i-table
      :columns="table.columns"
      :data="table.data"
      :show-header="false"
      size="small"
    ></i-table>
  </Card>
</template>


<script>
  import store from '@/store';

  export default {
    name: 'neuron-info',
    data() {
      return {
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
      store.$on('updateHoveredNeuron', hoveredNeuron => {
        this.table.data.forEach(propObj => propObj.value = hoveredNeuron ? hoveredNeuron[propObj.property] : '');
      });

      store.$on('circuitLoaded', () => {
        this.table.data = store.state.circuit.neuronProps.map(prop => ({property: prop, value: ''}));
      });
    },
  };
</script>


<style lang="scss">
  .ivu-table-small td {
    height: 22px;
  }
</style>
