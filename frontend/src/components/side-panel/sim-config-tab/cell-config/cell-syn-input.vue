
<template>
  <div
    class="sym-input-container-inner"
    :class="{'disabled': !synInput.gid}"
  >
    <p class="title">
      Gid: {{ synInput.gid }}
      <span
        class="cta-title ml-6"
        v-if="!synInput.gid"
      >
        Click on a segment in 3d viewer to make a selection
      </span>
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
          size="small"
          placeholder="Prop"
          :transfer="true"
          v-model="synInput.preSynCellProp"
          @on-change="updateFilters"
        >
          <i-option
            v-for="prop in preSynCellProps"
            :value="prop"
            :key="prop"
          >{{ prop }}</i-option>
        </i-select>
      </i-col>
      <i-col span="12">
        <AutoComplete
          size="small"
          v-model="synInput.preSynCellPropVal"
          :data="preSynCellPropValues"
          :filter-method="valueFilterMethod"
          :transfer="true"
          placeholder="Value"
        ></AutoComplete>
      </i-col>
      <i-col span="4">
        <InputNumber
          size="small"
          v-model="synInput.spikeFrequency"
          :min="0.5"
          :max="40"
          :step="0.5"
          placeholder="f, Hz"
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
      updateFilters() {
        const { synInputs } = store.state.simulation;

        const currentProp = this.synInput.preSynCellProp;
        this.preSynCellPropValues = this.filterSet[currentProp]
          .filter(propValue => !synInputs.find((input) => {
            return input.preSynCellProp === currentProp && input.preSynCellPropVal === propValue;
          }));
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
</style>
