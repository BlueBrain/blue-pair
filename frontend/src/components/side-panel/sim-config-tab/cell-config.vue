
<template>
  <div>
    <Card>
      <Collapse
        v-model="collapsePanel.stimuli"
      >
        <Panel>
          <strong>Stimuli</strong>
          <div slot="content">
            <p class="cta-title" v-if="isNoStimuli">
              Pick a cell section or press plus button below to add stimulus
            </p>
            <div
              v-else
              class="stimuli-group"
              v-for="(stimuliSet, gid) of stimuli"
              :key="gid"
            >
              <Poptip
                trigger="hover"
                placement="left-start"
                :transfer="true"
                width="540"
              >
                <h4
                  @mouseover="onGidHover(gid)"
                  @mouseleave="onGidUnhover()"
                >
                  GID: {{ gid }}
                </h4>
                <div slot="content">
                  <neuron-info :gid="gid"/>
                </div>
              </Poptip>

              <div
                class="stimuli-container"
                v-for="(stimulus, stimulusIndex) of stimuliSet"
                :key="stimulus.sectionName"
              >
                <transition name="fadeHeight">
                  <cell-stimulus
                    :key="stimulus.sectionName"
                    class="cell-stimulus"
                    v-model="stimuli[gid][stimulusIndex]"
                    @on-close="removeStimulus(stimulus)"
                  />
                </transition>
              </div>

            </div>
            <div>
              <transition
                name="fade"
                mode="out-in"
              >
                <cell-stimulus
                  v-if="tmpStimulus"
                  class="cell-stimulus"
                  v-model="tmpStimulus"
                  key="tmpStimulus"
                  @on-close="removeTmpStimulus()"
                />
                <i-button
                  v-else
                  class="mt-12"
                  size="small"
                  key="addTmpStimulusBtn"
                  @click="addTmpStimulus()"
                >Add stimulus</i-button>
              </transition>
            </div>
          </div>
        </Panel>
      </Collapse>

      <Collapse
        class="mt-12"
        v-model="collapsePanel.recordings"
      >
        <Panel>
          <strong>Recordings</strong>
          <div slot="content">
            <p
              v-if="isNoRecordings"
              class="cta-title"
            >
              Pick a cell section or press plus button below to add recording
            </p>
            <div
              else
              class="recordings-group"
              v-for="(recordingsSet, gid) of recordings"
              :key="gid"
            >
              <Poptip
                trigger="hover"
                placement="left-start"
                :transfer="true"
                width="540"
              >
                <h4
                  @mouseover="onGidHover(gid)"
                  @mouseleave="onGidUnhover()"
                >
                  GID: {{ gid }}
                </h4>
                <div slot="content">
                  <neuron-info :gid="gid"/>
                </div>
              </Poptip>

              <div class="recordings-container">
                <Tag
                  closable
                  class="recording-tag"
                  v-for="recording of recordingsSet"
                  :key="recording.sectionName"
                  @on-close="removeRecording(recording)"
                >
                  <span
                    @mouseover="onSectionLabelHover(recording)"
                    @mouseleave="onSectionLabelUnhover()"
                  >
                    {{ recording.sectionName  || '---' | shortSectionName }}
                  </span>
                </Tag>
              </div>

            </div>
            <div class="tmp-recording-container mt-12">
              <transition
                name="fade"
                mode="out-in"
              >
                <div v-if="tmpRecording">
                  <Tag
                    type="border"
                    closable
                    @on-close="removeTmpRecording()"
                  >
                    GID: ---, sec: ---
                  </Tag>
                  <span class="cta-title ml-6">
                    Click on a segment in 3d viewer to make a selection
                  </span>
                </div>
                <i-button
                  v-else
                  size="small"
                  @click="addTmpRecording()"
                >
                  Add recording
                </i-button>
              </transition>
            </div>
          </div>
        </Panel>
      </Collapse>

      <Collapse
        class="mt-12"
        v-model="collapsePanel.traces"
      >
        <Panel>
          <strong>Traces</strong>
          <div slot="content">
            <div
              class="trace-container"
              v-for="(trace, gid) of traces"
              :key="gid"
            >
              <h4
                @mouseover="onGidHover(gid)"
                @mouseleave="onGidUnhover()"
              >
                GID: {{ gid }}
              </h4>
              <dygraph
                v-if="trace.chart.data.length"
                :data="trace.chart.data"
                :labels="trace.chart.labels"
              />
            </div>
          </div>
        </Panel>
      </Collapse>
    </Card>
  </div>
</template>


<script>
  import groupBy from 'lodash/groupBy';

  import store from '@/store';
  import Dygraph from '@/components/shared/dygraph';
  import CellStimulus from './cell-config/cell-stimulus.vue';
  import NeuronInfo from '@/components/shared/neuron-info';

  // TODO: move to @/src/constants/ui
  const PANEL = {
    stimuli: 'stimuli',
    recordings: 'recordings',
    traces: 'traces',
  };

  export default {
    name: 'cell-config',
    components: {
      'cell-stimulus': CellStimulus,
      dygraph: Dygraph,
      'neuron-info': NeuronInfo,
    },
    data() {
      return {
        collapsePanel: {
          stimuli: [0],
          recordings: [0],
          traces: [],
        },
        tmpStimulus: null,
        tmpRecording: null,
        stimuli: {},
        recordings: {},
        traces: {},
      };
    },
    mounted() {
      store.$on('ws:simulation_result', (data) => {
        // TODO: this handler should be on sim-config-tab component level
        // TODO: refactor
        const traceGids = Object.keys(data);
        traceGids.forEach((gid) => {
          const secNames = Object.keys(data[gid].voltage);
          const shortSecNames = secNames.map(secName => secName.match(/\.(.*)/)[1]);

          const chartData = data[gid].time.map((timestamp, i) => {
            return secNames.reduce((trace, secName) => trace.concat(data[gid].voltage[secName][i]), [timestamp]);
          });

          this.traces[gid] = {
            chart: {
              data: chartData,
              labels: ['t'].concat(shortSecNames),
            },
            download: {},
          };
        });

        this.collapseAllPanels();
        this.uncollapsePanel(PANEL.traces);
      });
      store.$on('updateStimuli', () => {
        this.stimuli = groupBy(store.$get('stimuli'), stimulus => stimulus.gid);
        this.uncollapsePanel(PANEL.stimuli);
      });
      store.$on('updateRecordings', () => {
        this.recordings = groupBy(store.$get('recordings'), recording => recording.gid);
        this.uncollapsePanel(PANEL.recordings);
      });
      store.$on('morphSegmentSelected', (segment) => {
        if (this.tmpStimulus && !store.$get('isStimulusPresent', segment)) {
          store.$dispatch('addStimulus', {
            gid: segment.neuron.gid,
            sectionName: segment.sectionName,
          });
          this.removeTmpStimulus();
        }

        if (this.tmpRecording && !store.$get('isRecordingPresent', segment)) {
          store.$dispatch('addRecording', {
            gid: segment.neuron.gid,
            sectionName: segment.sectionName,
          });
          this.removeTmpRecording();
        }
      });
    },
    methods: {
      removeStimulus(stimulus) {
        store.$dispatch('removeStimulus', stimulus);
      },
      removeRecording(recording) {
        store.$dispatch('removeRecording', recording);
      },
      collapseAllPanels() {
        this.collapsePanel.stimuli = [];
        this.collapsePanel.recordings = [];
        this.collapsePanel.traces = [];
      },
      uncollapsePanel(panel) {
        this.collapsePanel[panel] = [0];
      },
      onGidHover(gid) {
        store.$dispatch('simConfigGidLabelHovered', Number(gid));
      },
      onGidUnhover() {
        store.$dispatch('simConfigGidLabelUnhovered');
      },
      addTmpStimulus() {
        this.tmpStimulus = {
          gid: null,
          sectionName: null,
          type: 'step',
          delay: 100,
          duration: 400,
          current: 0.7,
          stopCurrent: 0.2,
        };
        this.updateWaitingSecSelection();
      },
      removeTmpStimulus() {
        this.tmpStimulus = null;
        this.updateWaitingSecSelection();
      },
      addTmpRecording() {
        this.tmpRecording = {
          gid: null,
          sectionName: null,
        };
        this.updateWaitingSecSelection();
      },
      removeTmpRecording() {
        this.tmpRecording = null;
        this.updateWaitingSecSelection();
      },
      updateWaitingSecSelection() {
        store.$dispatch('setWaitingSecSelection', !!this.tmpRecording || this.tmpStimulus);
      },
      onSectionLabelHover(section) {
        store.$dispatch('simConfigSectionLabelHovered', section.gid);
      },
      onSectionLabelUnhover() {
        store.$dispatch('simConfigSectionLabelUnhovered');
      },
    },
    computed: {
      isNoStimuli() {
        return !(Object.keys(this.stimuli).length);
      },
      isNoRecordings() {
        return !(Object.keys(this.recordings).length);
      },
    },
  };
</script>


<style lang="scss" scoped>
  .cta-title {
    font-weight: normal;
    font-size: 12px;
    color: #888888;
    margin-bottom: 12px;
  }

  .stimuli-group, .recordings-group {
    margin-bottom: 12px;

    h4 {
      margin: 12px 0 6px 0;
      cursor: help;
    }
  }

  .stimuli-container, {
    margin-bottom: 12px;
    border-left: 12px solid #eaeaea;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .tmp-recording-container {
    .ivu-tag {
      margin: 0;
    }
  }

  .trace-container {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .recording-tag.ivu-tag {
    background-color: rgba(#00bfff, .3);
  }
</style>
