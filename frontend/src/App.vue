
<template>
  <div>
    <top-bar/>
    <viewport-component/>
    <side-panel/>
    <legenda-bar/>
  </div>
</template>


<script>
  import TopBar from './components/top-bar';
  import Viewport from './components/viewport';
  import SidePanel from './components/side-panel';
  import Legenda from './components/legenda';

  export default {
    name: 'app',
    components: {
      'top-bar': TopBar,
      'viewport-component': Viewport,
      'side-panel': SidePanel,
      'legenda-bar': Legenda,
    },
  };
</script>
