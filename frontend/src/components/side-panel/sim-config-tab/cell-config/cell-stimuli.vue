
<template>
  <div>
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
</template>


<script>
  import groupBy from 'lodash/groupBy';

  import store from '@/store';

  import CellStimulus from './cell-stimulus.vue';
  import NeuronInfo from '@/components/shared/neuron-info.vue';

  export default {
    name: 'cell-stimuli',
    data() {
      return {
        tmpStimulus: null,
        stimuli: {},
      };
    },
    components: {
      'cell-stimulus': CellStimulus,
      'neuron-info': NeuronInfo,
    },
    mounted() {
      store.$on('updateStimuli', () => {
        this.stimuli = groupBy(store.$get('stimuli'), stimulus => stimulus.gid);
        // this.uncollapsePanel(PANEL.stimuli);
      });

      store.$on('morphSegmentSelected', (segment) => {
        if (this.tmpStimulus && !store.$get('isStimulusPresent', segment)) {
          store.$dispatch('addStimulus', {
            gid: segment.neuron.gid,
            sectionName: segment.sectionName,
          });
          this.removeTmpStimulus();
        }
      });
    },
    methods: {
      removeStimulus(stimulus) {
        store.$dispatch('removeStimulus', stimulus);
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
    },
  };
</script>


<style lang="scss" scoped>
  .stimuli-container, {
    margin-bottom: 12px;
    border-left: 12px solid #eaeaea;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .stimuli-group, {
    margin-bottom: 12px;

    h4 {
      margin: 12px 0 6px 0;
      cursor: help;
    }
  }
</style>
