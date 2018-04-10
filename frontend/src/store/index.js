
import eventBus from '@/services/event-bus';

import state from './state';
import getters from './getters';
import actions from './actions';


class Store {
  constructor() {
    this.state = state;
    this.eventBus = eventBus;
  }

  $get(property, args) {
    return getters[property](this, args);
  }

  $dispatchSync(action, payload) {
    actions[action](this, payload);
  }

  $dispatch(action, payload) {
    if (!actions[action]) throw new Error(`Store action ${action} is not available`);
    setTimeout(() => actions[action](this, payload), 0);
  }

  $emitSync(action, payload) {
    this.eventBus.$emit(action, payload);
  }

  $emit(action, payload) {
    setTimeout(() => this.eventBus.$emit(action, payload), 0);
  }

  $on(action, handler) {
    this.eventBus.$on(action, handler);
  }
}

export default new Store();
