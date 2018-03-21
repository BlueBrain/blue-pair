
<template>
  <Card>
    <Row :gutter="24">
      <i-col span="12">
        <Form :label-width="120" label-position="left">
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
      <i-col span="12">
        <Form :label-width="120" label-position="left">
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
    </Row>
  </Card>
</template>


<script>
  import store from '@/store';

  export default {
    name: 'global-config',
    data() {
      return {
        config: store.state.simulation.globalConfig,
      };
    },
    methods: {
      onConfigChange() {
        store.$dispatch('updateGlobalSimConfig', this.config);
      },
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
