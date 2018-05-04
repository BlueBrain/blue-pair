
<template>
  <div id="container">
    <canvas :id="canvasId"></canvas>
    <morph-segment-poptip/>
    <bottom-panel/>
  </div>
</template>


<script>
  import store from '@/store';
  import NeuronRenderer from '@/services/neuron-renderer';
  import BottomPanel from './viewport/bottom-panel.vue';
  import MorphSegmentPoptip from './viewport/morph-segment-poptip.vue';

  export default {
    name: 'viewport-component',
    data() {
      return {
        canvasId: 'canvas',
      };
    },
    components: {
      'bottom-panel': BottomPanel,
      'morph-segment-poptip': MorphSegmentPoptip,
    },
    mounted() {
      const canvas = document.getElementById(this.canvasId);
      this.renderer = new NeuronRenderer(canvas, {
        onHover: this.onHover.bind(this),
        onHoverEnd: this.onHoverEnd.bind(this),
        onClick: this.onClick.bind(this),
      });
      // TODO: refactor
      store.$dispatch('loadCircuit');
      store.$on('circuitLoaded', this.initRenderer.bind(this));
      store.$on('setSomaSize', size => this.renderer.setNeuronCloudPointSize(size));
      store.$on('setSynapseSize', size => this.renderer.setMorphSynapseSize(size));
      store.$on('redrawCircuit', this.redrawNeurons.bind(this));
      store.$on('showCellMorphology', morphObj => this.renderer.initMorphology(morphObj));
      store.$on('removeCellMorphology', () => {
        this.renderer.disposeSecMarkers();
        this.renderer.disposeCellMorphology();
        this.renderer.destroySynapseCloud();
      });
      store.$on('initSynapseCloud', cloudSize => this.renderer.initSynapseCloud(cloudSize));
      store.$on('updateSynapses', () => this.renderer.updateSynapses());

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
        switch (obj.type) {
        case 'cloudNeuron': {
          const neuron = store.$get('neuron', obj.neuronIndex);
          store.$dispatch('neuronHovered', neuron);
          break;
        }
        case 'synapse': {
          store.$dispatch('synapseHovered', obj.synapseIndex);
          break;
        }
        case 'morphSegment': {
          store.$dispatch('morphSegmentHovered', obj);
          break;
        }
        default: {
          break;
        }
        }
      },
      onHoverEnd(obj) {
        switch (obj.type) {
        case 'cloudNeuron': {
          const neuron = store.$get('neuron', obj.neuronIndex);
          store.$dispatch('neuronHoverEnded', neuron);
          break;
        }
        case 'synapse': {
          store.$dispatch('synapseHoverEnded', obj.synapseIndex);
          break;
        }
        case 'morphSegment': {
          store.$dispatch('morphSegmentHoverEnded', obj);
          break;
        }
        default: {
          break;
        }
        }
      },
      onClick(obj) {
        switch (obj.type) {
        case 'neuronCloud': {
          const neuron = store.$get('neuron', obj.index);
          store.$dispatch('neuronClicked', neuron);
          break;
        }
        case 'morphSegment': {
          store.$dispatch('morphSegmentClicked', obj);
          break;
        }
        default: {
          break;
        }
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
