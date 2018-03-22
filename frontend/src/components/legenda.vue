
<template>
  <color-palette/>
</template>

<script>
  import ColorPalette from './side-panel/circuit-tab/color-palette.vue';

  export default {
    name: 'legenda-bar',
    components: {
      'color-palette': ColorPalette,
    },
  };
</script>
