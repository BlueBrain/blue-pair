
<template>
  <div
    class="sym-input-container-inner"
    :class="{'disabled': !synInput.gid}"
  >
    <p class="mb-6">
      Synapses visible:
      <i-switch
        size="small"
        v-model="synInput.synapsesVisible"
        @on-change="emitSynInputChange"
      >
      </i-switch>
    </p>

    <div
      class="close-btn"
      @click="onClose"
    >
      <Icon type="ios-close-empty"></Icon>
    </div>

    <Row :gutter="6">
      <i-col span="8">
        <i-select
          v-model="synInput.preSynCellProp"
          :disabled="!synInput.gid"
          :transfer="true"
          size="small"
          placeholder="Prop"
          @on-change="onPreSynCellPropChange"
        >
          <i-option
            v-for="prop in preSynCellProps"
            :value="prop"
            :key="prop"
          >{{ prop }}</i-option>
        </i-select>
      </i-col>
      <i-col span="12">
        <!-- TODO: use v-model when this bug is fixed: https://github.com/iview/iview/issues/2489 -->
        <AutoComplete
          :value="synInput.preSynCellPropVal"
          :disabled="!synInput.gid"
          :data="preSynCellPropValues"
          :filter-method="valueFilterMethod"
          :transfer="true"
          size="small"
          placeholder="Value"
          @on-change="onPreSynCellPropValueChange"
        ></AutoComplete>
      </i-col>
      <i-col span="4">
        <InputNumber
          v-model="synInput.spikeFrequency"
          :disabled="!synInput.gid"
          :min="0.5"
          :max="40"
          :step="0.5"
          size="small"
          placeholder="f, Hz"
          @on-change="emitSynInputChange"
        ></InputNumber>
      </i-col>
    </Row>
  </div>
</template>


<script>
  import store from '@/store';

  export default {
    name: 'cell-syn-input',
    props: ['value', 'filterSet'],
    data() {
      return {
        synInput: this.value,
        preSynCellProps: [],
        preSynCellPropValues: [],
      };
    },
    mounted() {
      this.preSynCellProps = Object.keys(this.filterSet);
    },
    methods: {
      onPreSynCellPropChange() {
        this.updateValidity();
        this.updateFilters();
        this.emitSynInputChange();
      },
      onPreSynCellPropValueChange(val) {
        this.synInput.preSynCellPropVal = val;
        this.updateValidity();
        this.emitSynInputChange();
      },
      updateValidity() {
        this.synInput.valid = this.synInput.gid &&
          this.synInput.preSynCellProp &&
          this.synInput.preSynCellPropVal;
      },
      updateFilters() {
        const { synInputs } = store.state.simulation;

        const currentProp = this.synInput.preSynCellProp;
        this.preSynCellPropValues = this.filterSet[currentProp]
          .filter(propValue => !synInputs.find((input) => {
            if (!input.valid) return false;

            return input.preSynCellProp === currentProp && input.preSynCellPropVal === propValue;
          }));
      },
      emitSynInputChange() {
        this.$emit('input', this.synInput);
      },
      onClose() {
        this.$emit('on-close');
      },
      valueFilterMethod(value, option) {
        if (!value) return true;

        return option.toString().toUpperCase().includes(value.toString().toUpperCase());
      },
    },
  };
</script>


<style lang="scss" scoped>
  .sym-input-container-inner {
    position: relative;
    border: 1px solid #e9eaec;
    background-color: #d7eafd;
    border-radius: 3px;
    padding: 8px;

    &.disabled {
      background-color: #eee;
    }
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
</style>
