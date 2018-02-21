
<template>
  <div class="top-bar">
    <div class="title">
      Pair recording App
    </div>
    <div class="status">
      {{ status.message }}
    </div>
  </div>
</template>


<script>
  import store from '@/store';

  export default {
    name: 'top-bar',
    data() {
      return {
        status: {
          message: 'Ready',
        },
      };
    },
    mounted() {
      store.$on('updateStatus', status => this.status = status);
    },
  };
</script>


<style scoped lang="scss">
  .top-bar {
    position: relative;
    height: 28px;
    line-height: 28px;
    background-color: #3e1b3e;
    padding: 0 .5em;
    color: #fffefc;

    .status {
      position: absolute;
      height: 100%;
      right: 0;
      top: 0;
      padding-right: 12px;
    }
  }
</style>
