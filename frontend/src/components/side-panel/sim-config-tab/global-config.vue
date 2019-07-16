
<template>
  <div>
    <Card>
      <Row :gutter="24">
        <i-col span="8">
          <Form
            label-position="left"
            :label-width="105"
            @submit.native.prevent
          >
            <FormItem label="t_stop [ms]">
              <InputNumber
                size="small"
                v-model="config.tStop"
                :min="100"
                :max="3000"
                :step="10"
                placeholder="Duration"
                @on-change="onConfigChange"
              />
            </FormItem>
          </Form>
        </i-col>
        <i-col span="8">
          <Form
            label-position="left"
            :label-width="105"
            @submit.native.prevent
          >
            <FormItem label="time step [ms]">
              <InputNumber
                size="small"
                :min="0.001"
                :max="0.1"
                :step="0.005"
                v-model="config.timeStep"
                placeholder="Resolution"
                @on-change="onConfigChange"
              />
            </FormItem>
          </Form>
        </i-col>
        <i-col span="8">
          <Form
            label-position="left"
            :label-width="105"
            @submit.native.prevent
          >
            <FormItem label="forward skip [ms]">
              <InputNumber
                size="small"
                :min="0"
                :max="5000"
                :step="10"
                v-model="config.forwardSkip"
                placeholder="Forward skip"
                @on-change="onConfigChange"
              />
            </FormItem>
          </Form>
        </i-col>
      </Row>

      <i-form
        class="mt-12"
        label-position="left"
        :label-width="105"
        @submit.native.prevent
      >
        <FormItem label="opts">
          <CheckboxGroup>
            <Checkbox v-model="config.addMinis">
              add minis
            </Checkbox>
            <Checkbox
              v-model="config.addReplay"
              :disabled="!isBlueConfig"
            >
              add replay
            </Checkbox>
          </CheckboxGroup>
        </FormItem>
        <FormItem label="net stimuli">
          <Checkbox
            v-model="config.netStimuli.all"
            class="mr-24"
            :disabled="!isBlueConfig"
            @on-change="onStimAllChange"
          >
            all
          </Checkbox>
          <Checkbox
            class="ml-12"
            v-model="config.netStimuli.noise"
            :disabled="!isBlueConfig"
            @on-change="onStimPartChange"
          >
            noise
          </Checkbox>
          <Checkbox
            v-model="config.netStimuli.hyperpolarizing"
            :disabled="!isBlueConfig"
            @on-change="onStimPartChange"
          >
            hyperpolarizing
          </Checkbox>
          <Checkbox
            v-model="config.netStimuli.relativelinear"
            :disabled="!isBlueConfig"
            @on-change="onStimPartChange"
          >
            relativelinear
          </Checkbox>
          <Checkbox
            v-model="config.netStimuli.pulse"
            :disabled="!isBlueConfig"
            @on-change="onStimPartChange"
          >
            pulse
          </Checkbox>
        </FormItem>
      </i-form>

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
          >
            Run Simulation
          </i-button>
          <i-button
            v-else
            long
            size="small"
            type="warning"
            :loading="loading"
            @click="onCancelSimBtnClick"
          >
            Cancel Simulation
          </i-button>
        </i-col>
      </Row>

    </Card>

    <sim-init-modal :visible="simInitModalVisible"/>
  </div>
</template>


<script>
  import store from '@/store';
  import constants from '@/constants';
  import SimProgress from './global-config/sim-progress.vue';
  import SimInitModal from './global-config/sim-init-modal.vue';

  const { Entity } = constants;

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
        isBlueConfig: false,
      };
    },
    methods: {
      onConfigChange() {
        store.$dispatch('updateGlobalSimParams', this.config);
      },
      onRunSimBtnClick() {
        const { recordings } = store.state.simulation;
        if (!recordings.length) {
          this.$Modal.warning({
            title: 'No recordings found',
            content: 'Please add at least one recording in order to run simulation.',
            okText: 'OK',
            closable: true,
          });
          return;
        }

        this.simRunning = true;
        this.simInitModalVisible = true;
        store.$dispatchAsync('runSim');
      },
      onCancelSimBtnClick() {
        this.loading = true;
        store.$dispatch('cancelSim');
      },
      onStimAllChange(stim) {
        const netStimuli = {
          all: stim,
          noise: stim,
          hyperpolarizing: stim,
          relativelinear: stim,
          pulse: stim,
        };
        this.$set(this.config, 'netStimuli', netStimuli);
        this.onConfigChange();
      },
      onStimPartChange() {
        const { netStimuli } = this.config;
        const allStim = netStimuli.noise
          && netStimuli.hyperpolarizing
          && netStimuli.relativelinear
          && netStimuli.pulse;

        this.$set(this.config.netStimuli, 'all', allStim);
        this.onConfigChange();
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
      store.$on('ws:simulation_compile_ch_mech_err', (errMessage) => {
        this.loading = false;
        this.simRunning = false;
        this.simInitModalVisible = false;
        this.$Modal.error({
          title: 'Channel mechanisms error',
          content: errMessage,
        });
      });
      store.$on('updateAvailableSimConfigOptions', () => {
        const { type } = store.state.circuitConfig;
        this.isBlueConfig = type === Entity.SIMULATION;
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
