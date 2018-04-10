
<template>
  <i-table
    :columns="table.columns"
    :data="table.data"
    :show-header="false"
    size="small"
  ></i-table>
</template>


<script>
  const hiddenProps = ['x', 'y', 'z', 'orientation'];

  export default {
    name: 'neuron-info',
    props: ['neuron'],
    data() {
      return {
        table: {
          columns: [{
            key: 'prop',
            width: 128,
          }, {
            key: 'val',
            ellipsis: true,
          }],
          data: [],
        },
      };
    },
    created() {
      this.table.data = Object.entries(this.neuron)
        .filter(([prop]) => !hiddenProps.includes(prop))
        .map(([prop, val]) => ({ prop, val }));
    },
  };
</script>


<style lang="scss">
  .ivu-table-small td {
    height: 22px;
  }
</style>
