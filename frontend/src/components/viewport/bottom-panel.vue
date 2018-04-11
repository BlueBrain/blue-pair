
<template>
  <div class="bottom-panel-container">

    <transition name="fade">
      <div class="circuit-panel" v-if="mode === 'cellSelection'">
        <color-palette/>
        <div class="soma-size-ctrl">
          <soma-size-ctrl/>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div class="sim-panel" v-if="mode === 'simulationConfig'">
        <syn-color-palette/>
      </div>
    </transition>

  </div>
</template>


<script>
  import store from '@/store';

  // Cell selection components
  import ColorPalette from './bottom-panel/color-palette.vue';
  import SomaSizeCtrl from './bottom-panel/soma-size-ctrl.vue';

  // Simulation config components
  import SynColorPalette from './bottom-panel/syn-color-palette.vue';

  export default {
    components: {
      'color-palette': ColorPalette,
      'soma-size-ctrl': SomaSizeCtrl,
      'syn-color-palette': SynColorPalette,
    },
    data() {
      return {
        mode: 'cellSelection',
      };
    },
    mounted() {
      store.$on('setBottomPanelMode', (mode) => { this.mode = mode; });
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
