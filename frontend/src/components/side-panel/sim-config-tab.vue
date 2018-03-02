
<template>
  <div>
    <global-config/>
    <cell-config/>
  </div>
</template>

<script>
  import GlobalConfig from './sim-config-tab/global-config';
  import CellConfig from './sim-config-tab/cell-config';

  export default {
    name: 'sim-config-tab',
    components: {
      'global-config': GlobalConfig,
      'cell-config': CellConfig,
    },
  };
</script>
