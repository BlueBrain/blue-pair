
<template>
  <div>
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
        <i-col span="18">
          <sim-progress/>
        </i-col>
        <i-col span="6">
          <i-button
            v-if="!simRunning"
            long
            size="small"
            type="primary"
            @click="onRunSimBtnClick"
          >Run Simulation</i-button>
          <i-button
            v-else
            long
            size="small"
            type="warning"
            :loading="loading"
            @click="onCancelSimBtnClick"
          >Cancel Simulation</i-button>
        </i-col>
      </Row>

    </Card>

    <sim-init-modal :visible="simInitModalVisible"/>
  </div>
</template>


<script>
  import store from '@/store';
  import SimProgress from './global-config/sim-progress.vue';
  import SimInitModal from './global-config/sim-init-modal.vue';

  export default {
    name: 'global-config',
    components: {
      'sim-progress': SimProgress,
      'sim-init-modal': SimInitModal,
    },
    data() {
      return {
        config: store.state.simulation.params,
        loading: false,
        simRunning: false,
        simInitModalVisible: false,
      };
    },
    methods: {
      onConfigChange() {
        store.$dispatch('updateGlobalSimParams', this.config);
      },
      onRunSimBtnClick() {
        this.simRunning = true;
        this.simInitModalVisible = true;
        store.$dispatchAsync('runSim');
      },
      onCancelSimBtnClick() {
        this.loading = true;
        store.$dispatch('cancelSim');
      },
    },
    mounted() {
      store.$on('ws:simulation_result', () => {
        this.loading = false;
        setTimeout(() => { this.simInitModalVisible = false; }, 1200);
      });
      store.$on('ws:simulation_finish', () => {
        this.loading = false;
        this.simRunning = false;
        this.simInitModalVisible = false;
      });
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
