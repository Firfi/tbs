import machina from 'machina';
import { TextReplyMessage } from '../../chatModel/messages';
import globalCommands, { helloArgs } from './globalCommands';
import { unlock as unlockConvo, setConvo } from '../../router/convoSession';
const last = require('lodash/last');

import createFlow from './flows/createFlow/createFlow';
import rateFlow from './flows/rateFlow/rateFlow';
import testFlow from './flows/testFlow/testFlow';

const compose = require('composition');

import wrap from '../utils/compose';

export default new machina.BehavioralFsm({
  initialize(...args) {
  },

  namespace: 'peer',

  initialState: 'welcome',

  states: Object.assign({

    welcome: {
      async _onEnter(client) {
        await client.convo.reply(...helloArgs);
        this.emit('handle.done', client.convo);
      },
      async _reset(client) {
        // if (client.sessionKey) unlockConvo(client.sessionKey);
      },
      '*': wrap(globalCommands, () => {})
      // async '*'(client, action_, convo) {
      //   if (convo.locked()) return console.warn('locked yet!');
      //   await convo.lock();
      //   await new Promise((success) => {
      //     setTimeout(success, 2000)
      //   });
      //   await convo.reply(new TextReplyMessage('hello world'));
      //   await convo.unlock();
      //   this.transition(client, 'derp');
      //   this.emit('handle.done', convo);
      // }
    }
  }, createFlow, rateFlow, testFlow)

});
