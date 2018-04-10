
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
      store.$on('updateHoveredNeuron', (hoveredNeuron) => {
        this.visible = !!hoveredNeuron;
        this.table.data.forEach((propObj) => {
          propObj.value = hoveredNeuron ? hoveredNeuron[propObj.property] : '';
        });
      });

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
