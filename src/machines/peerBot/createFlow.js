const mapKeys = require('lodash/mapKeys');

import { addRecord, popRecord, rateRecord, aspects, getSession, getSessionPromise,
  storeRateNotification, popRateNotifications, PeerRatingRateNotification, ratesForRecord } from './store.js';

import globalCommands from './globalCommands';

const genericMessageToRecord = genericMessage => {
  const { type } = genericMessage;
  return { [type]: genericMessage.content, fromId: genericMessage.user.telegramId, chatId: genericMessage.chatId, type };
};

export default mapKeys({
  init: {
    async _onEnter(client) {
      this.transition(client, 'createFlow.waitForInput');
    },
    async '*'(client, convo) {
      this.transition(client, 'createFlow.waitForInput');
    }
  },

  waitForInput: globalCommands({
    _reset() {},
    async _onEnter(client) {
      await client.convo.reply('Add your item to rate');
      this.emit('handle.done', client.convo);
      // TODO set timeout to move back
    },
    async '*'(client, action_, convo) {
      try {
        const record = genericMessageToRecord(convo.message);
        await addRecord(record);
        await convo.reply('Record added.');
        this.transition(client, 'rateFlow.init');
        this.emit('handle.done', client.convo);
      } catch(e) { // TODO generic error handling
        console.error(e);
        this.transition(client, 'welcome');
        this.emit('handle.done', client.convo);
        throw e;
      }

    }
  })
}, (v, k) => `createFlow.${k}`)
