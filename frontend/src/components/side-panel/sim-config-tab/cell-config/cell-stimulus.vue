
<template>
  <div class="stimulus-container-inner">
    <!-- HEADER -->
    <p class="title">{{ sectionName | prettySectionName }}</p>

    <div class="close-btn" @click="onClose">
      <Icon type="ios-close-empty"></Icon>
    </div>

    <!-- CURRENT INJECTION TYPE -->
    <Row :gutter="12" class="stimulus-type-container">
      <i-col span="12">
        <i-select
          size="small"
          placeholder="Type"
          v-model="stimulus.type"
          @on-change="onChange"
        >
            <i-option
              v-for="(stimulusLabel, stimulusType) of stimulusTypes"
              :key="stimulusType"
              :value="stimulusType"
            >
              {{ stimulusLabel }}
            </i-option>
        </i-select>
      </i-col>
    </Row>

    <!-- CONFIG -->
    <div>
      <!-- STEP CURRENT CONFIG -->
      <Row
        v-if="stimulus.type === 'step'"
        :gutter="16"
      >
        <i-col span="8">
          <i-form :label-width="40">
            <FormItem label="delay:">
              <InputNumber
                size="small"
                v-model="stimulus.delay"
                :min="0"
                :max="3000"
                :step="100"
                @on-change="onChange"
              >
              </InputNumber>
            </FormItem>
          </i-form>
        </i-col>
        <i-col span="8">
          <i-form :label-width="55">
            <FormItem label="duration:">
              <InputNumber
                size="small"
                v-model="stimulus.duration"
                :min="0"
                :max="3000"
                :step="100"
                @on-change="onChange"
              >
              </InputNumber>
            </FormItem>
          </i-form>
        </i-col>
        <i-col span="8">
          <i-form :label-width="30">
            <FormItem label="amp:">
              <!-- TODO: check max values for current -->
              <InputNumber
                size="small"
                v-model="stimulus.current"
                :min="0.1"
                :max="10"
                :step="0.1"
                @on-change="onChange"
              ></InputNumber>
            </FormItem>
          </i-form>
        </i-col>
      </Row>

      <!-- RAMP CURRENT CONFIG -->
      <Row
        v-if="stimulus.type === 'ramp'"
        :gutter="16"
      >
        <i-col span="6">
          <i-form :label-width="40">
            <FormItem label="delay:">
              <InputNumber
                size="small"
                v-model="stimulus.delay"
                :min="0"
                :max="3000"
                :step="100"
                @on-change="onChange"
              >
              </InputNumber>
            </FormItem>
          </i-form>
        </i-col>
        <i-col span="6">
          <i-form :label-width="55">
            <FormItem label="duration:">
              <InputNumber
                size="small"
                v-model="stimulus.duration"
                :min="0"
                :max="3000"
                :step="100"
                @on-change="onChange"
              >
              </InputNumber>
            </FormItem>
          </i-form>
        </i-col>
        <i-col span="6">
          <i-form :label-width="67">
            <FormItem label="start amp:">
              <InputNumber
                size="small"
                v-model="stimulus.current"
                :min="0.1"
                :max="10"
                :step="0.1"
                @on-change="onChange"
              ></InputNumber>
            </FormItem>
          </i-form>
        </i-col>
        <i-col span="6">
          <i-form :label-width="67">
            <FormItem label="stop amp:">
              <InputNumber
                size="small"
                v-model="stimulus.stopCurrent"
                :min="0.1"
                :max="10"
                :step="0.1"
                @on-change="onChange"
              ></InputNumber>
            </FormItem>
          </i-form>
        </i-col>
      </Row>
    </div>

  </div>
</template>


<script>
  const stimulusTypes = {
    step: 'Step current',
    ramp: 'Ramp current',
  };

  export default {
    name: 'cell-stimulus',
    props: ['value', 'sectionName'],
    data() {
      return {
        stimulusTypes,
        stimulus: Object.assign({}, this.value),
      };
    },
    methods: {
      onChange() {
        this.$emit('input', this.stimulus);
      },
      onClose() {
        this.$emit('on-close');
      },
    },
  }
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
    margin-bottom: 12px;
    border: 1px solid #e9eaec;
    background-color: #f7f7f7;
    border-radius: 3px;
    padding: 8px;
  }

  .title {
    line-height: 24px;
    margin-bottom: 6px;
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
