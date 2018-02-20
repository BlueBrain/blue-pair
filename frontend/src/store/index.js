
import eventBus from '@/services/event-bus';

import state from './state';
import getters from './getters';
import actions from './actions';


class Store {
  constructor() {
    this.state = state;
  }

  $get(property, args) {
    return getters[property](this, args);
  }

  $dispatchSync(action, payload) {
    actions[action](this, payload)
  }

  $dispatch(action, payload) {
    setTimeout(() => actions[action](this, payload), 0);
  }

  $emitSync(action, payload) {
    eventBus.$emit(action, payload);
  }

  $emit(action, payload) {
    setTimeout(() => eventBus.$emit(action, payload), 0);
  }

  $on(action, handler) {
    eventBus.$on(action, handler);
  }
}

export default new Store();
