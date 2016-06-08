import machina from 'machina';
import { TextReplyMessage } from '../../chatModel/messages.js';
import { unlock as unlockConvo } from '../../router/convoSession.js';

export default new machina.BehavioralFsm({
  initialize(options) {
    console.warn('peerbot init');
  },

  namespace: 'peer',

  initialState: 'welcome',

  states: {

    welcome: {
      // async _onEnter(client) {
      //   console.warn('onEnter')
      //   if (client.id) unlockConvo(client.id);
      // },
      async '*'(client, action_, convo) {
        // if (convo.locked()) return console.warn('locked yet!');
        // await convo.lock();
        await new Promise((success) => {
          setTimeout(success, 2000)
        });
        await convo.reply(new TextReplyMessage('hello world'));
        // await convo.unlock();
      }
    }
  }

});
