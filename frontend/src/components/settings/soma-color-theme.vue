
<template>
  <Card>
    <Row :gutter="12">
      <i-col span="12">
        <Form
          label-position="left"
          :label-width="120"
          @submit.native.prevent
        >
          <FormItem label="Color by:" style="margin-bottom: 0">
            <i-select
              size="small"
              placeholder="Color by"
              v-model="currentProp"
              @on-change="onColorPropChange"
            >
              <i-option
                v-for="neuronProp in props"
                :value="neuronProp"
                :key="neuronProp"
              >{{ neuronProp }}</i-option>
            </i-select>
          </FormItem>
        </Form>
      </i-col>
      <i-col span="12">
        <Form
          label-position="left"
          :label-width="120"
          @submit.native.prevent
        >
          <FormItem label="Color theme:" style="margin-bottom: 0">
            <i-select
              size="small"
              placeholder="Color theme"
              v-model="currentTheme"
              @on-change="onColorPropChange"
            >
              <i-option
                v-for="(t, tKey) in theme"
                :value="tKey"
                :key="tKey"
              >{{ t.label }}</i-option>
            </i-select>
          </FormItem>
        </Form>
      </i-col>
    </Row>
  </Card>
</template>

<script>
  import * as DistinctColors from 'distinct-colors';

  import store from '@/store';


  const theme = {
    default: {
      label: 'Default',
      config: {
        hueMin: 0,
        hueMax: 360,
        chromaMin: 60,
        chromaMax: 100,
        lightMin: 20,
        lightMax: 90,
      },
    },
    allColors: {
      label: 'All colors',
      config: {
        hueMin: 0,
        hueMax: 360,
        chromaMin: 0,
        chromaMax: 100,
        lightMin: 0,
        lightMax: 100,
      },
    },
    pastel: {
      label: 'Pastel',
      config: {
        hueMin: 0,
        hueMax: 360,
        chromaMin: 0,
        chromaMax: 40,
        lightMin: 60,
        lightMax: 100,
      },
    },
    pimp: {
      label: 'Pimp',
      config: {
        hueMin: 0,
        hueMax: 360,
        chromaMin: 30,
        chromaMax: 100,
        lightMin: 25,
        lightMax: 70,
      },
    },
    intenso: {
      label: 'Intenso',
      config: {
        hueMin: 0,
        hueMax: 360,
        chromaMin: 20,
        chromaMax: 100,
        lightMin: 15,
        lightMax: 80,
      },
    },
    fluo: {
      label: 'Fluo',
      config: {
        hueMin: 0,
        hueMax: 300,
        chromaMin: 35,
        chromaMax: 100,
        lightMin: 75,
        lightMax: 100,
      },
    },
  };


  export default {
    name: 'neuron-color',
    data() {
      return {
        theme,
        currentTheme: 'default',
        props: [],
        currentProp: '',
        uniqueValuesByProp: {},
      };
    },
    mounted() {
      store.$on('initNeuronColor', this.init);
    },
    methods: {
      init() {
        const { neurons, neuronProps } = store.state.circuit;
        const neuronSample = neurons[0];

        this.uniqueValuesByProp = neuronProps.reduce((uniqueValuesByProp, propName, propIndex) => {
          const propsToSkip = ['x', 'y', 'z'];
          if (propsToSkip.includes(propName)) return uniqueValuesByProp;

          const propType = typeof neuronSample[propIndex];
          if (propType !== 'string' && propType !== 'number') return uniqueValuesByProp;

          const propUniqueValues = Array.from(new Set(neurons.map(n => n[propIndex])));
          if (propUniqueValues.length > 20) return uniqueValuesByProp;

          return Object.assign(uniqueValuesByProp, { [propName]: propUniqueValues.sort() });
        }, {});

        this.props = Object.keys(this.uniqueValuesByProp);
        this.currentProp = this.props.includes('layer') ? 'layer' : this.props[0];

        this.generatePalette();
      },
      onColorPropChange() {
        this.generatePalette();
        store.$dispatch('colorUpdated');
      },
      generatePalette() {
        const currentPropValues = this.uniqueValuesByProp[this.currentProp];

        const colorConfig = Object.assign(
          { count: currentPropValues.length },
          theme[this.currentTheme].config,
        );

        const colors = new DistinctColors(colorConfig);

        const colorPalette = currentPropValues.reduce((palette, propVal, i) => {
          return Object.assign(palette, { [propVal.toString()]: colors[i].gl() });
        }, {});

        store.state.circuit.color = {
          palette: colorPalette,
          neuronProp: this.currentProp,
        };
      },
    },
  };
</script>


<style lang="scss" scoped>
  .ivu-card {
    margin-bottom: 12px;
  }
</style>

