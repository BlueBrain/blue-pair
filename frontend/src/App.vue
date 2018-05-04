
<template>
  <div>
    <top-bar/>
    <viewport-component/>
    <side-panel/>
    <spinner/>
    <circuit-loading-modal />
  </div>
</template>


<script>
  import store from '@/store';

  import TopBar from './components/top-bar';
  import Viewport from './components/viewport';
  import SidePanel from './components/side-panel';
  import Spinner from './components/spinner';
  import CircuitLoadingModal from './components/circuit-loading-modal.vue';

  export default {
    name: 'app',
    components: {
      'top-bar': TopBar,
      'viewport-component': Viewport,
      'side-panel': SidePanel,
      'spinner': Spinner,
      'circuit-loading-modal': CircuitLoadingModal,
    },
  };
</script>


<style lang="scss">
  html {
    overflow: hidden;
    height: 100%;
  }

  body {
    height: 100%;
    overflow: auto;
  }

  // TODO: move to separate style file
  .fade-enter-active, .fade-leave-active {
    transition: opacity .2s;
  }
  .fade-enter, .fade-leave-to {
    opacity: 0;
  }

  .fadeHeight-enter-active, .fadeHeight-leave-active {
    transition: all .2s;
    max-height: 200px;
  }
  .fadeHeight-enter, .fadeHeight-leave-to
  {
    opacity: 0;
    max-height: 0px;
  }

  .mt-12 {
    margin-top: 12px;
  }

  .mt-6 {
    margin-top: 6px;
  }

  .ml-6 {
    margin-left: 6px;
  }

  .mb-6 {
    margin-bottom: 6px;
  }

  .ivu-collapse-header {
    height: 24px !important;
    line-height: 24px !important;
  }

  .cta-title {
    font-weight: normal;
    font-size: 12px;
    color: #888888;
    margin-bottom: 12px;
  }
</style>
