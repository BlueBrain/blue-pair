
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
