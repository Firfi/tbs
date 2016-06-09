import machina from 'machina';
import { TextReplyMessage } from '../../chatModel/messages.js';
import { unlock as unlockConvo } from '../../router/convoSession.js';

export default new machina.BehavioralFsm({
  initialize(options) {
  },

  namespace: 'peer',

  initialState: 'welcome',

  states: {

    welcome: {
      async _reset(client) {
        if (client.sessionKey) unlockConvo(client.sessionKey);
      },
      async '*'(client, action_, convo) {
        if (convo.locked()) return console.warn('locked yet!');
        await convo.lock();
        await new Promise((success) => {
          setTimeout(success, 2000)
        });
        await convo.reply(new TextReplyMessage('hello world'));
        await convo.unlock();
        this.transition(client, 'derp');
        this.emit('handle.done', convo);
      }
    },
    derp: {
      async _reset(client) {},
      async '*'(client, action_, convo) {
        await convo.reply(new TextReplyMessage('derp'));
        this.transition(client, 'welcome');
        this.emit('handle.done', convo);
      }
    }
  }

});
