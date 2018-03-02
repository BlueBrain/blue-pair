
<template>
  <div class="stimulus-container-inner">
    <p class="title">{{ sectionName | prettySectionName }}</p>

    <div class="close-btn" @click="onClose">
      <Icon type="ios-close-empty"></Icon>
    </div>

    <Row :gutter="12" class="stimulus-type-container">
      <i-col span="12">
        <i-select
          size="small"
          placeholder="Type"
          v-model="stimulus.type"
          @on-change="onChange"
        >
            <i-option value="step">Step current</i-option>
        </i-select>
      </i-col>
    </Row>

    <Row :gutter="16">
      <i-col span="8">
        <i-form :label-width="40">
          <FormItem label="delay:">
            <InputNumber
              size="small"
              v-model="stimulus.delay"
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
              @on-change="onChange"
            >
            </InputNumber>
          </FormItem>
        </i-form>
      </i-col>
      <i-col span="8">
        <i-form :label-width="30">
          <FormItem label="amp:">
            <InputNumber
              size="small"
              :step="0.1"
              v-model="stimulus.current"
              @on-change="onChange"
            ></InputNumber>
          </FormItem>
        </i-form>
      </i-col>
    </Row>
  </div>
</template>


<script>
  export default {
    name: 'cell-stimulus',
    props: ['value', 'sectionName'],
    data() {
      return {
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
    right: 8px;
    top: 0;
    padding: 0 4px;
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
