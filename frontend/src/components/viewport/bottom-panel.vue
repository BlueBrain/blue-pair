
<template>
  <div class="bottom-panel-container">
    <color-palette/>
    <div class="soma-size-ctrl">
      <soma-size-ctrl/>
    </div>
  </div>
</template>


<script>
  import ColorPalette from './bottom-panel/color-palette.vue';
  import SomaSizeCtrl from './bottom-panel/soma-size-ctrl.vue';

  export default {
    components: {
      'color-palette': ColorPalette,
      'soma-size-ctrl': SomaSizeCtrl,
    },
  };
</script>


<style lang="scss" scoped>
  .bottom-panel-container {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;

    .soma-size-ctrl {
      position: absolute;
      right: 12px;
      top: -224px;
    }
  }
</style>
