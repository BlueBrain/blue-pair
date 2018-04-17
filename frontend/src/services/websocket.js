
import get from 'lodash/get';

import config from '@/config';
import eventBus from './event-bus';


const socketState = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
};

const reconnectTimeout = 2000;


class Ws {
  constructor() {
    this.cmdId = 0;
    this.messageQueue = [];
    this.requestResolvers = new Map();
    this.socket = null;

    this._initWebSocket();
  }

  send(message, data, cmdId = null) {
    switch (this.socket.readyState) {
      case socketState.OPEN:
        this.socket.send(JSON.stringify({
          data,
          cmd: message,
          cmdid: cmdId,
          timestamp: Date.now(),
        }));
        break;
      case socketState.CONNECTING:
      case socketState.CLOSING:
      case socketState.CLOSED:
      default:
        this.messageQueue.push([message, data, cmdId]);
        break;
    }
  }

  async request(message, data) {
    const currentCmdId = ++this.cmdId;
    const response = new Promise((resolve) => {
      this.requestResolvers.set(currentCmdId, resolve);
    });
    this.send(message, data, currentCmdId);
    return response;
  }

  _initWebSocket() {
    this.socket = new WebSocket(`ws://${config.server.host}:${config.server.port}/ws`);

    this.socket.addEventListener('open', () => this._processQueue());
    this.socket.addEventListener('error', e => console.error(e));
    this.socket.addEventListener('close', () => this._reconnect());

    this.socket.addEventListener('message', (e) => {
      const message = JSON.parse(e.data);

      const cmdId = get(message, 'data.cmdid');
      if (cmdId) {
        const requestResolver = this.requestResolvers.get(cmdId);
        requestResolver(message.data);
        this.requestResolvers.delete(cmdId);
        return;
      }

      eventBus.$emit(`ws:${message.cmd}`, message.data);
    });
  }

  _reconnect() {
    setTimeout(() => this._initWebSocket(), reconnectTimeout);
  }

  _processQueue() {
    let queueLength = this.messageQueue.length;
    while (queueLength--) {
      const message = this.messageQueue.unshift();
      this.send(...message);
    }
  }
}


export default new Ws();
