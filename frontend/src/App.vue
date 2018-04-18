
<template>
  <div>
    <top-bar/>
    <viewport-component/>
    <side-panel/>
    <spinner/>
  </div>
</template>


<script>
  import TopBar from './components/top-bar';
  import Viewport from './components/viewport';
  import SidePanel from './components/side-panel';
  import Spinner from './components/spinner';

  export default {
    name: 'app',
    components: {
      'top-bar': TopBar,
      'viewport-component': Viewport,
      'side-panel': SidePanel,
      'spinner': Spinner,
    },
  };
</script>


<style lang="scss">
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

  .ml-6 {
    margin-left: 6px;
  }

  .ivu-collapse-header {
    height: 24px !important;
    line-height: 24px !important;
  }
</style>
