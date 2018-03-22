
<template>
  <Card>
    <Row :gutter="12">
      <i-col span="12">
        <Form :label-width="120" label-position="left">
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
        <Form :label-width="120" label-position="left">
          <FormItem label="Color theme:" style="margin-bottom: 0">
            <i-select
              size="small"
              placeholder="Color theme"
              v-model="currentTheme"
            >
              <i-option
                v-for="theme in themes"
                :value="theme"
                :key="theme"
              >{{ theme }}</i-option>
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


  const themes = ['Default', 'Dark', 'Light', 'Saturated', 'Distinct'];

  export default {
    name: 'neuron-color',
    data() {
      return {
        themes,
        currentTheme: themes[0],
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
          if (propUniqueValues.length > 1000) return uniqueValuesByProp;

          return Object.assign(uniqueValuesByProp, {[propName]: propUniqueValues.sort()});
        }, {});

        this.props = Object.keys(this.uniqueValuesByProp);
        this.currentProp = this.props.includes('layer') ? 'layer': this.props[0];

        this.generatePalette();
      },
      onColorPropChange() {
        this.generatePalette();
        store.$dispatch('colorUpdated');
      },
      generatePalette() {
        const currentPropValues = this.uniqueValuesByProp[this.currentProp];

        const colors = DistinctColors({
          count: currentPropValues.length,
          chromaMin: 60,
          // lightMin: 40,
        });

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
