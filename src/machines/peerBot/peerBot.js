import machina from 'machina';
import { TextReplyMessage } from '../../chatModel/messages.js';

export default new machina.BehavioralFsm({
  initialize(options) {
    console.warn('peerbot init');
  },

  namespace: 'peer',

  initialState: 'welcome',

  states: {
    welcome: {
      '*'(client, convo) {
        console.warn('test');
        convo.reply(new TextReplyMessage('hello world'));
      }
    }
  }

});
