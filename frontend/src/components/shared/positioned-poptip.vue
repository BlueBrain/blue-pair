
<template>
  <div class="pos-poptip-container" ref="container" @mouseleave="onMouseLeave()">
    <Poptip
      popper-class="pos-poptip-popper"
      trigger="hover"
    >
      <div class="container-inner" :class="{'hidden': containerInnerHidden}"></div>
      <div slot="content">
        <slot></slot>
      </div>
    </Poptip>
  </div>
</template>


<script>
  // TODO: refactor
  export default {
    name: 'positioned-poptip',
    props: ['position'],
    data() {
      return {
        containerInnerHidden: true,
      };
    },
    computed: {
      currentPosition() {
        return this.position;
      },
    },
    watch: {
      currentPosition() {
        this.$refs.container.style.top = `${this.position.y - 2}px`;
        this.$refs.container.style.left = `${this.position.x}px`;

        // Changing layout here with display: none
        // to force FireFox to dispatch mouseenter and mouseover events on Poptip element
        this.containerInnerHidden = false;
      },
    },
    methods: {
      onMouseLeave() {
        this.containerInnerHidden = true;
      },
    },
  };
</script>


<style lang="scss">
  .pos-poptip-container {
    position: fixed;
    // initial position is out of the screen
    top: -20px;
    left: -20px;

    .ivu-poptip {
      line-height: 1px;
      display: block;
    }
  }

  .pos-poptip-popper {
    .ivu-poptip-body {
      padding: 6px;
      border-radius: 3px;
    }

    .ivu-poptip-popper {
      min-width: 100px;
    }
  }

  .container-inner, .pos-poptip-container {
    height: 1px;
    width: 1px;
  }

  .container-inner {
    position: absolute;
    left: 0;
    top: 0;
  }

  .hidden {
    display: none;
  }
</style>

