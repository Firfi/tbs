const mapKeys = require('lodash/mapKeys');

import { addRecord } from '../../store.js';

import wrap from '../../../utils/compose';

import globalCommands, { menuKb }  from '../../globalCommands';

import { utils as telegramUtils } from '../../../../telegram';
const { hideKeyboard } = telegramUtils;

import messages from './views/messages';

const genericMessageToRecord = genericMessage => {
  const { type } = genericMessage;
  return { [type]: genericMessage.content, fromId: genericMessage.user.telegramId, chatId: genericMessage.chatId, type };
};

export default mapKeys({
  init: {
    async _onEnter(client) {
      await client.convo.reply(messages().addYourItem); // hideKeyboard(menuKb) we can't hide it and change at the same time
      this.transition(client, 'createFlow.waitForInput');
    },
    '*': wrap(async function (ctx) {
      ctx.machina.transition(ctx.client, 'createFlow.waitForInput');
    })
  },

  waitForInput: {
    async _onEnter(client) {
      this.emit('handle.done', client.convo);
      // TODO set timeout to move back
    },
    '*': wrap([globalCommands, async function(ctx, next) {
      console.warn('wwinput');
      const { client, convo, machina } = ctx;
      try {
        const record = genericMessageToRecord(convo.message);
        await addRecord(record);
        await convo.reply(messages().recordAdded);
        machina.transition(client, 'rateFlow.init');
      } catch(e) {
        console.error(e);
        machina.transition(client, 'welcome');
        throw e;
      }
    }])
  }
}, (v, k) => `createFlow.${k}`)
