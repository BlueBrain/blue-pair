
<template>
  <transition name="fade">
    <div
      class="container"
      v-if="colorPalette && visible"
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
  </transition>
</template>


<script>
  import * as chroma from 'chroma-js';

  import store from '@/store';

  export default {
    name: 'color-palette',
    data() {
      return {
        colorPalette: {},
        visible: true,
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
      store.$on('hideColorPalette', () => this.hide());
      store.$on('showColorPalette', () => this.show());
    },
    methods: {
      onMouseOver(paletteKey) {
        store.$dispatch('paletteKeyHover', paletteKey);
      },
      onMouseLeave() {
        store.$dispatch('paletteKeyUnhover');
      },
      hide() {
        this.visible = false;
      },
      show() {
        this.visible = true;
      },
    },
  };
</script>


<style scoped lang="scss">
  .fade-enter-active, .fade-leave-active {
    transition: opacity .3s;
  }
  .fade-enter, .fade-leave-to {
    opacity: 0;
  }

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
