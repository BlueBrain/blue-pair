
<template>
  <positioned-poptip :position="position">

    <div
      class="mb-6"
      v-if="sectionType === 'soma'"
    >
      <i-button
        type="default"
        size="small"
        long
        @click="onSynInputAdd()"
      >
        + Syn inputs
      </i-button>
    </div>

    <div>
      <i-button
        type="warning"
        size="small"
        :disabled="btn.stimulus.disabled"
        @click="onStimulusAdd()"
      >
        + Stimulus
      </i-button>

      <i-button
        type="info"
        size="small"
        class="ml-6"
        :disabled="btn.recording.disabled"
        @click="onRecordingAdd()"
      >
        + Recording
      </i-button>
    </div>

  </positioned-poptip>
</template>


<script>
  import some from 'lodash/some';

  import store from '@/store';

  import PositionedPoptip from '@/components/shared/positioned-poptip.vue';

  const sectionTypeRegexp = /\.(\w*)/;

  export default {
    name: 'morph-segment-poptip',
    components: {
      'positioned-poptip': PositionedPoptip,
    },
    data() {
      return {
        position: {
          x: -20,
          y: -20,
        },
        segment: null,
        sectionType: null,
        btn: {
          recording: { disabled: false },
          stimulus: { disabled: false },
        },
      };
    },
    mounted() {
      store.$on('showMorphSegmentPoptip', (context) => {
        this.position = context.clickPosition;

        this.segment = {
          gid: context.data.neuron.gid,
          sectionName: context.data.sectionName,
        };

        this.sectionType = context.data.sectionName.match(sectionTypeRegexp)[1];

        this.updateBtnStatus();
      });
    },
    methods: {
      onStimulusAdd() {
        store.$dispatch('addStimulus', this.segment);
        this.updateBtnStatus();
      },
      onRecordingAdd() {
        store.$dispatch('addRecording', this.segment);
        this.updateBtnStatus();
      },
      onSynInputAdd() {
        store.$dispatch('addSynInput', this.segment.gid);
      },
      updateBtnStatus() {
        const { recordings, stimuli } = store.state.simulation;
        const { sectionName } = this.segment;

        this.btn.recording.disabled = some(recordings, r => r.sectionName === sectionName);
        this.btn.stimulus.disabled = some(stimuli, s => s.sectionName === sectionName);
      },
    },
  };
</script>
