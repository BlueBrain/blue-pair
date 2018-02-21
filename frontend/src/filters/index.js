
import Vue from 'vue';

import prettySectionNameFilter from './pretty-section-name';
import shortSectionNameFilter from './short-section-name';

function init() {
  Vue.filter('prettySectionName', prettySectionNameFilter);
  Vue.filter('shortSectionName', shortSectionNameFilter);
}

export default {
  init,
};
