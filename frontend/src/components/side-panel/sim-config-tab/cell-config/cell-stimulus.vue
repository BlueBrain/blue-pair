
<template>
  <div
    class="stimulus-container-inner"
    :class="{'disabled': !stimulus.sectionName}"
  >
    <!-- HEADER -->
    <p
      class="title"
      @mouseover="onSectionLabelHover(stimulus)"
      @mouseleave="onSectionLabelUnhover()"
    >
      Sec: {{ stimulus.sectionName || '---' }}
      <span
        class="cta-title ml-6"
        v-if="!stimulus.sectionName"
      >
        Click on a section in 3d viewer to make a selection
      </span>
    </p>

    <div
      class="close-btn"
      @click="onClose"
    >
      <Icon type="ios-close-empty"></Icon>
    </div>

    <!-- STIMULUS TYPE -->
    <Row :gutter="12" class="stimulus-type-container">
      <i-col span="12">
        <i-select
          size="small"
          placeholder="Stimulus type"
          v-model="stimulus.type"
          :disabled="!stimulus.sectionName"
          @on-change="onChange"
        >
            <i-option
              v-for="(stimulusLabel, stimulusType) of stimulusTypes"
              :key="stimulusType"
              :value="stimulusType"
              :disabled="stimulus.sectionType !== 'soma' && somaOnlyStimuli.includes(stimulusType)"
            >
              {{ stimulusLabel }}
              <span
                v-if="stimulus.sectionType !== 'soma' && somaOnlyStimuli.includes(stimulusType)"
              >
                (soma only)
              </span>
            </i-option>
        </i-select>
      </i-col>
    </Row>

    <!-- CONFIG -->
    <div>

      <!-- STEP CURRENT CONFIG -->
      <div v-if="stimulus.type === 'step'">
        <Row :gutter="16">
          <i-col span="8">
            <i-form
              :label-width="40"
              @submit.native.prevent
            >
              <FormItem label="delay:">
                <InputNumber
                  size="small"
                  v-model="stimulus.delay"
                  :min="0"
                  :max="3000"
                  :step="10"
                  :disabled="!stimulus.sectionName"
                  @on-change="onChange"
                >
                </InputNumber>
              </FormItem>
            </i-form>
          </i-col>
          <i-col span="8">
            <i-form
              :label-width="55"
              @submit.native.prevent
            >
              <FormItem label="duration:">
                <InputNumber
                  size="small"
                  v-model="stimulus.duration"
                  :min="0"
                  :max="3000"
                  :step="10"
                  :disabled="!stimulus.sectionName"
                  @on-change="onChange"
                >
                </InputNumber>
              </FormItem>
            </i-form>
          </i-col>
          <i-col span="8">
            <i-form
              :label-width="30"
              @submit.native.prevent
            >
              <FormItem label="amp:">
                <!-- TODO: check max values for current -->
                <InputNumber
                  size="small"
                  v-model="stimulus.current"
                  :min="0.1"
                  :max="50"
                  :step="0.1"
                  :disabled="!stimulus.sectionName"
                  @on-change="onChange"
                ></InputNumber>
              </FormItem>
            </i-form>
          </i-col>
        </Row>
      </div>

      <!-- RAMP CURRENT CONFIG -->
      <div v-else-if="stimulus.type === 'ramp'">
        <Row :gutter="16">
          <i-col span="6">
            <i-form
              :label-width="40"
              @submit.native.prevent
            >
              <FormItem label="delay:">
                <InputNumber
                  size="small"
                  v-model="stimulus.delay"
                  :min="0"
                  :max="3000"
                  :step="10"
                  @on-change="onChange"
                >
                </InputNumber>
              </FormItem>
            </i-form>
          </i-col>
          <i-col span="6">
            <i-form
              :label-width="55"
              @submit.native.prevent
            >
              <FormItem label="duration:">
                <InputNumber
                  size="small"
                  v-model="stimulus.duration"
                  :min="0"
                  :max="3000"
                  :step="10"
                  @on-change="onChange"
                >
                </InputNumber>
              </FormItem>
            </i-form>
          </i-col>
          <i-col span="6">
            <i-form
              :label-width="67"
              @submit.native.prevent
            >
              <FormItem label="start amp:">
                <InputNumber
                  size="small"
                  v-model="stimulus.current"
                  :min="0.1"
                  :max="50"
                  :step="0.1"
                  @on-change="onChange"
                ></InputNumber>
              </FormItem>
            </i-form>
          </i-col>
          <i-col span="6">
            <i-form
              :label-width="67"
              @submit.native.prevent
            >
              <FormItem label="stop amp:">
                <InputNumber
                  size="small"
                  v-model="stimulus.stopCurrent"
                  :min="0.1"
                  :max="50"
                  :step="0.1"
                  @on-change="onChange"
                ></InputNumber>
              </FormItem>
            </i-form>
          </i-col>
        </Row>
      </div>

      <!-- PULSE INJECTION CONFIG -->
      <div v-else-if="stimulus.type === 'pulse'">
        <Row :gutter="16">
          <i-col span="8">
            <i-form
              :label-width="60"
              @submit.native.prevent
            >
              <FormItem label="delay:">
                <InputNumber
                  size="small"
                  v-model="stimulus.delay"
                  :min="0"
                  :max="3000"
                  :step="10"
                  :disabled="!stimulus.sectionName"
                  @on-change="onChange"
                >
                </InputNumber>
              </FormItem>
            </i-form>
          </i-col>
          <i-col span="8">
            <i-form
              :label-width="60"
              @submit.native.prevent
            >
              <FormItem label="duration:">
                <InputNumber
                  size="small"
                  v-model="stimulus.duration"
                  :min="0"
                  :max="3000"
                  :step="10"
                  :disabled="!stimulus.sectionName"
                  @on-change="onChange"
                >
                </InputNumber>
              </FormItem>
            </i-form>
          </i-col>
          <i-col span="8">
            <i-form
              :label-width="60"
              @submit.native.prevent
            >
              <FormItem label="amp:">
                <!-- TODO: check max values for current -->
                <InputNumber
                  size="small"
                  v-model="stimulus.current"
                  :min="0.1"
                  :max="50"
                  :step="0.1"
                  :disabled="!stimulus.sectionName"
                  @on-change="onChange"
                ></InputNumber>
              </FormItem>
            </i-form>
          </i-col>
        </Row>
        <Row :gutter="16">
          <i-col span="8">
            <i-form
              :label-width="60"
              @submit.native.prevent
            >
              <FormItem label="frequency:">
                <InputNumber
                  size="small"
                  v-model="stimulus.frequency"
                  :min="1"
                  :max="100"
                  :step="1"
                  :disabled="!stimulus.sectionName"
                  @on-change="onChange"
                >
                </InputNumber>
              </FormItem>
            </i-form>
          </i-col>
          <i-col span="8">
            <i-form
              :label-width="60"
              @submit.native.prevent
            >
              <FormItem label="width:">
                <InputNumber
                  size="small"
                  v-model="stimulus.width"
                  :min="1"
                  :max="50"
                  :step="1"
                  :disabled="!stimulus.sectionName"
                  @on-change="onChange"
                >
                </InputNumber>
              </FormItem>
            </i-form>
          </i-col>
        </Row>
      </div>

      <!-- VOLTAGE CLAMP CONFIG -->
      <div v-else-if="stimulus.type === 'vclamp'">
        <Row :gutter="16">
          <i-col span="8">
            <i-form
              :label-width="55"
              @submit.native.prevent
            >
              <FormItem label="duration:">
                <InputNumber
                  size="small"
                  v-model="stimulus.duration"
                  :min="0"
                  :max="3000"
                  :step="10"
                  :disabled="!stimulus.sectionName"
                  @on-change="onChange"
                >
                </InputNumber>
              </FormItem>
            </i-form>
          </i-col>
          <i-col span="8">
            <i-form
              :label-width="55"
              @submit.native.prevent
            >
              <FormItem label="voltage:">
                <!-- TODO: check max values for voltage -->
                <InputNumber
                  size="small"
                  v-model="stimulus.voltage"
                  :min="-100"
                  :max="30"
                  :step="0.1"
                  :disabled="!stimulus.sectionName"
                  @on-change="onChange"
                ></InputNumber>
              </FormItem>
            </i-form>
          </i-col>
          <i-col span="8">
            <i-form
              :label-width="40"
              @submit.native.prevent
            >
              <FormItem label="rs:">
                <InputNumber
                  size="small"
                  v-model="stimulus.seriesResistance"
                  :min="0.001"
                  :max="1"
                  :step="0.001"
                  :disabled="!stimulus.sectionName"
                  @on-change="onChange"
                ></InputNumber>
              </FormItem>
            </i-form>
          </i-col>
        </Row>
      </div>
    </div>

  </div>
</template>


<script>
  import store from '@/store';

  const stimulusTypes = {
    step: 'Step current',
    ramp: 'Ramp current',
    pulse: 'Pulse current',
    vclamp: 'Voltage clamp',
  };

  const somaOnlyStimuli = ['pulse', 'vclamp'];

  export default {
    name: 'cell-stimulus',
    props: ['value'],
    data() {
      return {
        stimulusTypes,
        somaOnlyStimuli,
        stimulus: Object.assign({}, this.value),
        hovered: false,
      };
    },
    methods: {
      onChange() {
        this.$emit('input', this.stimulus);
      },
      onClose() {
        this.$emit('on-close', this.stimulus);
      },
      onSectionLabelHover(stimulus) {
        if (this.hovered || !stimulus.sectionName) return;
        store.$dispatch('simConfigSectionLabelHovered', stimulus.gid);
        this.hovered = true;
      },
      onSectionLabelUnhover() {
        this.hovered = false;
        store.$dispatch('simConfigSectionLabelUnhovered');
      },
    },
  };
</script>


<style lang="scss" scoped>
  .ivu-form-item {
    margin-bottom: 0;
  }

  .ivu-input-number {
    width: 100%;
  }

  .stimulus-container-inner {
    position: relative;
    border: 1px solid #e9eaec;
    // TODO: remove old color after acceptance
    // background-color: #f7f7f7;
    background-color: #ffa50021;
    border-radius: 3px;
    padding: 8px;

    &.disabled {
      background-color: #eee;
    }
  }

  .title {
    font-weight: 500;
    line-height: 24px;
    margin-bottom: 6px;
  }

  .cta-title {
    font-weight: normal;
    font-size: 12px;
    color: #888888;
    margin-bottom: 12px;
  }

  .close-btn {
    position: absolute;
    right: 0;
    top: 0;
    padding: 0 8px;
    font-size: 22px;
    line-height: 22px;
    color: #666;
    opacity: .66;
    cursor: pointer;

    &:hover {
      opacity: 1;
    }
  }

  .stimulus-type-container {
    position: relative;
    margin-bottom: 4px;
  }
</style>
