
<template>
  <div>
    <Card>
      <p>Selected section:</p>

      <div>

        <p v-if="selectedSegment">
          <strong>GID: {{ selectedSegment.neuron.gid }}</strong>
          , sec:
          <strong>{{ selectedSegment.sectionName | prettySectionName }}</strong>
        </p>

        <br>

        <Row>
          <i-col span="7">
            <ButtonGroup>
              <i-button
                size="small"
                type="primary"
                :disabled="addStimuliBtnActive || !selectedSegment"
                @click="addStimuli"
              >
                <Icon type="ios-plus-empty"></Icon>
                Stimuli
              </i-button>
              <i-button
                size="small"
                type="primary"
                :disabled="addRecordingBtnActive || !selectedSegment"
                @click="addRecording"
              >
                <Icon type="ios-plus-empty"></Icon>
                Recording
              </i-button>
            </ButtonGroup>
          </i-col>
          <i-col span="6" offset="11">
            <i-button
              long
              size="small"
              type="primary"
              :loading="runSimBtnLoading"
              @click="onRunSimBtnClick"
            >Run Simulation</i-button>
          </i-col>
        </Row>
      </div>
    </Card>


    <Card class="mt-12">

      <Collapse
        class="sim-cell"
        v-for="(cellConfig, cellConfigIndex) of cellConfigs"
        :key="cellConfig.neuron.gid"
      >
        <Panel>
          <strong>GID: {{ cellConfig.neuron.gid }}</strong>
          <div slot="content">
            <neuron-info :neuron="cellConfig.neuron"/>
          </div>
        </Panel>

        <Panel>
          Stimuli
          <div slot="content">
            <div
              v-for="(stimulus, stimulusIndex) of cellConfig.stimuli"
              :key="stimulus.sectionName"
            >
              <cell-stimulus
                v-model="cellConfig.stimuli[stimulusIndex]"
                :section-name="stimulus.sectionName"
                @on-close="removeStimulus(cellConfigIndex, stimulus.sectionName)"
              />
            </div>
          </div>
        </Panel>

        <Panel>
          Recordings
          <div slot="content">
            <div class="rec-sites">
              <Tag
                closable
                v-for="recording of cellConfig.recordings"
                :key="recording.sectionName"
                @on-close="removeRecording(cellConfigIndex, recording.sectionName)"
              >{{ recording.sectionName | shortSectionName }}</Tag>
            </div>
          </div>
        </Panel>

        <Panel>
          Traces
          <div slot="content">
            <dygraph
              v-if="cellConfig.trace"
              :data="cellConfig.trace.data"
              :labels="cellConfig.trace.labels"
            />
          </div>
        </Panel>
      </Collapse>
    </Card>

  </div>
</template>


<script>
  import remove from 'lodash/remove';
  import omit from 'lodash/omit';

  import Dygraph from '@/components/shared/dygraph';
  import store from '@/store';
  import CellStimulus from './cell-config/cell-stimulus';
  import NeuronInfo from '@/components/shared/neuron-info';

  export default {
    name: 'cell-config',
    components: {
      'cell-stimulus': CellStimulus,
      dygraph: Dygraph,
      'neuron-info': NeuronInfo,
    },
    data() {
      return {
        cellConfigs: [],
        selectedSegment: null,
        addStimuliBtnActive: true,
        addRecordingBtnActive: true,
        runSimBtnLoading: false,
      };
    },
    mounted() {
      store.$on('ws:simulation_result', (data) => {
        // TODO: this handler should be on sim-config-tab component level
        // TODO: refactor
        this.cellConfigs.forEach((cellConfig) => {
          cellConfig.trace = {};
          const gid = cellConfig.neuron.gid;
          if (!data[gid]) return;

          const secNames = Object.keys(data[gid]);
          cellConfig.trace.labels = ['t'].concat(secNames);
          cellConfig.trace.data = data[gid][secNames[0]].map((voltage, i) => {
            return secNames.reduce((trace, secName) => trace.concat(data[gid][secName][i]), [i]);
          });
        });
      });
      store.$on('updateSimCellConfig', (neurons) => {
        this.cellConfigs = neurons.map(neuron => ({
          neuron,
          stimuli: [],
          recordings: [],
          trace: null,
        }));
      });
      store.$on('morphSegmentSelected', (segment) => {
        this.selectedSegment = segment;
        this.updateAddBtnStatus();
      });
    },
    methods: {
      addRecording() {
        const cellConfig = this.getCellConfigByGid(this.selectedSegment.neuron.gid);
        cellConfig.recordings.push({ sectionName: this.selectedSegment.sectionName });
        this.onConfigChange();

        store.$dispatch('secRecordingAdded', {
          gid: this.selectedSegment.neuron.gid,
          sectionName: this.selectedSegment.sectionName,
        });
      },
      removeRecording(configIndex, sectionName) {
        store.$dispatch('secRecordingRemoved', {
          sectionName,
          gid: this.cellConfigs[configIndex].neuron.gid,
        });

        remove(this.cellConfigs[configIndex].recordings, r => r.sectionName === sectionName);
        this.onConfigChange();
      },
      addStimuli() {
        store.$dispatch('secInjectionAdded', {
          gid: this.selectedSegment.neuron.gid,
          sectionName: this.selectedSegment.sectionName,
        });

        const cellConfig = this.getCellConfigByGid(this.selectedSegment.neuron.gid);
        cellConfig.stimuli.push({
          sectionName: this.selectedSegment.sectionName,
          type: 'step',
          delay: 100,
          duration: 800,
          current: 0.7,
          stopCurrent: 0.2,
        });
        this.onConfigChange();
      },
      removeStimulus(configIndex, sectionName) {
        store.$dispatch('secInjectionRemoved', {
          sectionName,
          gid: this.cellConfigs[configIndex].neuron.gid,
        });

        remove(this.cellConfigs[configIndex].stimuli, s => s.sectionName === sectionName);
        this.onConfigChange();
      },
      onConfigChange() {
        store.$dispatch(
          'updateSimCellConfigs',
          this.cellConfigs.map(cellConfig => omit(cellConfig, ['trace'])),
        );
        this.updateAddBtnStatus();
      },
      getCellConfigByGid(gid) {
        return this.cellConfigs.find(config => config.neuron.gid === gid);
      },
      updateAddBtnStatus() {
        this.addStimuliBtnActive = this.sectionAddedByProp('stimuli');
        this.addRecordingBtnActive = this.sectionAddedByProp('recordings');
      },
      sectionAddedByProp(type) {
        return !!this.cellConfigs
          .map(c => c[type])
          .reduce((a, c) => a.concat(c, []))
          .find(c => c.sectionName === this.selectedSegment.sectionName);
      },
      onRunSimBtnClick() {
        // this.runSimBtnLoading = true;
        store.$dispatch('runSim');
      },
    },
  };
</script>


<style lang="scss" scoped>
  .sim-cell {
    margin-bottom: 24px;
  }

  .cell-config {
    margin-top: 12px;
    padding: 4px 0;
    border-top: 1px solid #e9eaec;
  }

  .stimuli, .rec-sites {
    margin-top: 12px;
    p {
      margin-bottom: 6px;
    }
  }
</style>

<style lang="scss">
  // move to global styles
  .mt-12 {
    margin-top: 12px;
  }

  .ivu-collapse-header {
    height: 24px !important;
    line-height: 24px !important;
  }
</style>

