
<template>
  <Card>
    <Row :gutter="24">
      <i-col span="8">
        <Form :label-width="105" label-position="left">
          <FormItem label="t_stop [ms]">
            <InputNumber
              size="small"
              v-model="config.tStop"
              :min="100"
              :max="3000"
              :step="100"
              placeholder="Duration"
              @on-change="onConfigChange"
            ></InputNumber>
          </FormItem>
        </Form>
      </i-col>
      <i-col span="8">
        <Form :label-width="105" label-position="left">
          <FormItem label="time step [ms]">
            <InputNumber
              size="small"
              :min="0.001"
              :max="0.1"
              :step="0.005"
              v-model="config.timeStep"
              placeholder="Resolution"
              @on-change="onConfigChange"
            ></InputNumber>
          </FormItem>
        </Form>
      </i-col>
      <i-col span="8">
        <Form :label-width="105" label-position="left">
          <FormItem label="forward skip [ms]">
            <InputNumber
              size="small"
              :min="0"
              :max="5000"
              :step="100"
              v-model="config.forwardSkip"
              placeholder="Forward skip"
              @on-change="onConfigChange"
            ></InputNumber>
          </FormItem>
        </Form>
      </i-col>
    </Row>

    <br>

    <Row>
      <i-col span="6" offset="18">
        <i-button
          long
          size="small"
          type="primary"
          :loading="loading"
          @click="onRunSimBtnClick"
        >Run Simulation</i-button>
      </i-col>
    </Row>

  </Card>
</template>


<script>
  import store from '@/store';

  export default {
    name: 'global-config',
    data() {
      return {
        config: store.state.simulation.params,
        loading: false,
      };
    },
    methods: {
      onConfigChange() {
        store.$dispatch('updateGlobalSimParams', this.config);
      },
      onRunSimBtnClick() {
        this.loading = true;
        store.$dispatch('runSim');
      },
    },
    mounted() {
      store.$on('ws:simulation_result', () => { this.loading = false; });
    },
  };
</script>


<style lang="scss" scoped>
  .ivu-form-item {
    margin-bottom: 2px;
  }

  .ivu-input-number {
    width: 100%;
  }

  .ivu-card {
    margin-bottom: 12px;
  }
</style>
