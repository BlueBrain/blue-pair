
<template>
  <div
    class="container"
    v-if="colorPalette"
  >
    <div class="palette-container">
      <div
        class="palette-item"
        v-for="(color, paletteKey) in colorPalette"
        :key="paletteKey"
        @mouseover="onMouseOver(paletteKey)"
        @mouseleave="onMouseLeave"
      >
        <small>{{ paletteKey }}</small>
        <div
          class="color-block"
          :style="{'background-color': color}"
        ></div>
      </div>
    </div>
  </div>
</template>


<script>
  import * as chroma from 'chroma-js';

  import store from '@/store';

  export default {
    name: 'color-palette',
    data() {
      return {
        colorPalette: {},
      };
    },
    mounted() {
      store.$on('updateColorPalette', () => {
        const glColorPalette = store.state.circuit.color.palette;
        const colorKeys = Object.keys(glColorPalette).sort();
        this.colorPalette = colorKeys.reduce((palette, colorKey) => {
          const color = chroma.gl(...glColorPalette[colorKey]).css();
          return Object.assign(palette, { [colorKey]: color });
        }, {});
      });
    },
    methods: {
      onMouseOver(paletteKey) {
        store.$dispatch('paletteKeyHover', paletteKey);
      },
      onMouseLeave() {
        store.$dispatch('paletteKeyUnhover');
      },
    },
  };
</script>


<style scoped lang="scss">
  .container {
    position: absolute;
    background-color: #fefdfb;
    border-top: 1px solid #bdc2c8;
    bottom: 0;
    left: 0;
    right: 620px;
    padding: 16px
  }

  .palette-container {
    display: flex;
    flex-wrap: wrap;
    flex: 1 1 100%;
  }

  .palette-item {
    display: flex;
    margin-right: 12px;
    margin-bottom: 6px;
    height: 18px;
    line-height: 18px;
    border: 1px solid #838383;

    small {
      padding: 0 6px;
    }

    .color-block {
      height: 100%;
      width: 18px;
      display: inline-block;
    }
  }
</style>
