
<template>
  <div class="pos-poptip-container" ref="container">
    <Poptip
      popper-class="pos-poptip-popper"
      trigger="hover"
      :transfer="true"
    >
      <div class="container-inner"></div>
      <div slot="content">
        <slot></slot>
      </div>
    </Poptip>
  </div>
</template>


<script>
  export default {
    name: 'positioned-poptip',
    props: ['position'],
    computed: {
      currentPosition() {
        return this.position;
      },
    },
    watch: {
      currentPosition() {
        this.$refs.container.style.top = `${this.position.y}px`;
        this.$refs.container.style.left = `${this.position.x}px`;
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
</style>

