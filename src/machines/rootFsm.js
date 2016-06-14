// TODO some menu here. for now - just a bot, without any states between
import machina from 'machina';

import peerBot from './peerBot/peerBot.js';

import { messageTypes } from '../chatModel/messages.js';

export default new machina.BehavioralFsm({
  initialize(options) {

  },

  '*'(client/*state*/, action, convo) {
    this.transition(client, 'peer');
  },

  namespace: 'root',

  initialState: 'peer',

  states: {
    init: {
      '*'(client, action_, convo) {
        this.transition(client, 'peer');
      }
    },
    peer: {
      _child: peerBot,
      exit: 'init'
    }
  }

});
