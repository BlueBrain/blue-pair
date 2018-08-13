
<template>
  <div class="container">
    <div class="centered">
      <Card>
        <h3 slot="title">
          <Icon class="mr-6" type="information-circled"></Icon>
          Service is down
        </h3>
        <p>
          We are really sorry, but due to backend cluster issues beyound our control Pair Recording app is currently offline. <br>
          If you have any questions don't hesitate to contact us. <br>
        </p>
        <br>
        <div class="text-right">
          <p>
            Brain Simulation Platform team
          </p>
        </div>
      </Card>
    </div>
  </div>
</template>


<script>
  export default {
    name: 'maintenance-page',
  };
</script>


<style scoped lang="scss">
  .container {
    background: url('/maintenance_bg.jpg');
    background-repeat: no-repeat;
    background-size: cover;
    height: 100%;
  }

  .centered {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
</style>
