
<template>
  <Tag
    closable
    color="blue"
    @on-close="onClose()"
  >
    {{ synInput.preSynCellProp }} - {{ synInput.preSynCellPropVal }}: {{ synInput.spikeFrequency }} Hz
  </Tag>
</template>


<script>
  export default {
    name: 'cell-syn-input',
    props: ['synInput'],
    data() {
      return {};
    },
    methods: {
      onClose() {
        this.$emit('on-close');
      },
    },
  };
</script>
