// TODO some menu here. for now - just a bot, without any states between
import machina from 'machina';

import peerBot from './peerBot/peerBot.js';

import { messageTypes } from '../chatModel/messages.js';

export default new machina.BehavioralFsm({
  initialize(options) {

  },

  '*'(client/*state*/, action, convo) { // todo 'message' to be more clear
    console.warn('root action...', client);
    // this.handle(client, convo.message.type, convo);
  },

  namespace: 'root',

  initialState: 'peer',

  states: {
    peer: {
      _child: peerBot
    }
  }

});
