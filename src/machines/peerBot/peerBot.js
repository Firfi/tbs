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
      _reset(client, convo) {},
      async '*'(client, action_, convo) {
        // convo.lock();
        await new Promise((success) => {
          setTimeout(success, 2000)
        });
        await convo.reply(new TextReplyMessage('hello world'));
        // convo.unlock();
      }
    }
  }

});
