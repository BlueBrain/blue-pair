
<template>
  <div
    class="hover-object-info-container opacity-transition"
    :class="{opaque: !visible}"
  >
    <h4>{{ content.header }}</h4>
    <div v-if="content.items">
      <div
        v-for="(item, index) in content.items"
        :key="index"
      >
        <h5 v-if="item.subHeader">
          {{ item.subHeader }}
        </h5>
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
  </div>
</template>


<script>
  import store from '@/store';

  export default {
    name: 'hover-object-info',
    data() {
      return {
        visible: false,
        content: {},
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

  .opacity-transition {
    transition: opacity 0.3s ease-in-out;
  }

  .opaque {
    opacity: 0;
  }
</style>
