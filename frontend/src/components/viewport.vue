
<template>
  <div id="container">
    <canvas :id="canvasId"></canvas>
    <bottom-panel/>
  </div>
</template>


<script>
  import store from '@/store';
  import NeuronRenderer from '@/services/neuron-renderer';
  import BottomPanel from './viewport/bottom-panel.vue';

  export default {
    name: 'viewport-component',
    data() {
      return {
        canvasId: 'canvas',
      };
    },
    components: {
      'bottom-panel': BottomPanel,
    },
    mounted() {
      this.renderer = new NeuronRenderer({
        canvasElementId: this.canvasId,
        onHover: this.onHover.bind(this),
        onClick: this.onClick.bind(this),
      });
      // TODO: refactor
      store.$dispatch('loadCircuit');
      store.$on('circuitLoaded', this.initRenderer.bind(this));
      store.$on('setSomaSize', size => this.renderer.setNeuronCloudPointSize(size));
      store.$on('redrawCircuit', this.redrawNeurons.bind(this));
      store.$on('showCellMorphology', morphObj => this.renderer.initMorphology(morphObj));
      store.$on('removeCellMorphology', () => {
        this.renderer.disposeSecMarkers();
        this.renderer.disposeCellMorphology();
        this.renderer.disposeSynapses();
      });
      store.$on('showSynConnections', () => this.renderer.showSynConnections());
      store.$on('hideCircuit', () => this.renderer.hideNeuronCloud());
      store.$on('showCircuit', () => this.renderer.showNeuronCloud());

      store.$on('highlightMorphCell', gid => this.renderer.highlightMorphCell(gid));
      store.$on('unhighlightMorphCell', () => this.renderer.unhighlightMorphCell());

      store.$on('highlightCircuitSoma', gid => this.renderer.highlightCircuitSoma(gid));
      store.$on('removeCircuitSomaHighlight', () => this.renderer.removeCircuitSomaHighlight());

      store.$on('addSecMarker', config => this.renderer.addSecMarker(config));
      store.$on('removeSecMarker', config => this.renderer.removeSecMarker(config));
    },
    methods: {
      onHover(obj) {
        const neuron = obj ? store.$get('neuron', obj.neuronIndex) : null;
        store.$dispatch('updateHoveredNeuron', neuron);
      },
      onClick(obj) {
        switch (obj.type) {
          case 'neuronCloud':
            const neuron = store.$get('neuron', obj.index);
            store.$dispatch('neuronClicked', neuron);
            break;
          case 'morphSegment':
            store.$dispatch('morphSegmentClicked', obj.data);
            break;
          default:
            break;
        }
      },
      initRenderer() {
        const neuronSetSize = store.state.circuit.neurons.length;
        this.renderer.initNeuronCloud(neuronSetSize);
        this.redrawNeurons();
        this.renderer.alignCamera();
      },
      redrawNeurons() {
        const {
          globalFilterIndex,
          neurons,
          neuronPropIndex,
          connectionFilterIndex,
          color: {
            palette,
            neuronProp,
          },
        } = store.state.circuit;

        const { positionBufferAttr, colorBufferAttr } = this.renderer.neuronCloud;

        neurons.forEach((neuron, neuronIndex) => {
          if (!globalFilterIndex[neuronIndex] || !connectionFilterIndex[neuronIndex]) {
            // TODO: find a better way to hide part of the cloud
            return positionBufferAttr.setXYZ(neuronIndex, 10000, 10000, 10000);
          }

          const neuronPosition = store.$get('neuronPosition', neuronIndex);
          const glColor = palette[neuron[neuronPropIndex[neuronProp]]];

          positionBufferAttr.setXYZ(neuronIndex, ...neuronPosition);
          colorBufferAttr.setXYZ(neuronIndex, ...glColor);
        });

        this.renderer.updateNeuronCloud();
      },
    },
  };
</script>


<style scoped lang="scss">
  #container {
    position: absolute;
    top: 28px;
    width: calc(100% - 620px);
    height: calc(100% - 28px);
  }

  .bottom-panel-ctrl {
    height: 232px;
    position: relative;

    .color-by-ctrl {
      position: absolute;
      z-index: 10;
      right: 51px;
      bottom: 12px;
      height: 40px;
      width: 220px;
      background-color: white;
      border: 1px solid #dddee1;
      border-right: none;
    }
  }
</style>
