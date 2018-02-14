
import 'iview/dist/styles/iview.css';

import Vue from 'vue';
import iView from 'iview';

import App from './App.vue';
import store from './store';

Vue.use(iView);

Vue.config.productionTip = true;

new Vue({
  store,
  render: h => h(App),
}).$mount('#app');