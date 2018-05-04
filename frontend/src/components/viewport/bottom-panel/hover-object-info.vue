
<template>
  <transition name="fade">
    <div
      class="hover-object-info-container"
      v-if="visible"
    >
      <h4>{{ content.header }}</h4>
      <div
        v-if="content"
        v-for="(item, index) in content.items"
        :key="index"
      >
        <h4 v-if="item.subHeader">
          {{ item.subHeader }}
        </h4>
        <div v-if="item.type === 'text'">
          <p>{{ item.data }}</p>
        </div>
        <div v-else-if="item.type === 'table'">
          <table>
            <tr
              v-for="(val, key) in item.data"
              :key="key"
            >
              <td>{{ key }}</td>
              <td>{{ val }}</td>
            </tr>
          </table>
        </div>
      </div>
    </div>
  </transition>
</template>


<script>
  import store from '@/store';

  export default {
    name: 'hover-object-info',
    data() {
      return {
        visible: false,
        content: null,
      };
    },
    mounted() {
      store.$on('showHoverObjectInfo', (content) => {
        this.content = content;
        this.visible = true;
      });
      store.$on('hideHoverObjectInfo', () => { this.visible = false; });
    },
  };
</script>


<style lang="scss" scoped>
  .hover-object-info-container {
    padding: 6px;
    background-color: white;
    border: 1px solid #dddee1;
    border-radius: 4px;
    height: 212px;
    width: 240px;
  }

  table {
    width: 100%;
  }
</style>
