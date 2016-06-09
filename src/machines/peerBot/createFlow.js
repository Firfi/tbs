import machina from 'machina';

const mapKeys = require('lodash/mapKeys');

import { addRecord, popRecord, rateRecord, aspects, getSession, getSessionPromise,
  storeRateNotification, popRateNotifications, PeerRatingRateNotification, ratesForRecord } from './store.js';

import { isCommand } from '../../utils/chat';
import globalCommands, { commandList } from './globalCommands';

const genericMessageToRecord = genericMessage => {
  return { content: genericMessage.content, fromId: genericMessage.user.telegramId, type: genericMessage.type };
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
        this.transition(client, 'welcome');
        this.emit('handle.done');
      } catch(e) { // TODO generic error handling
        console.error(e);
      }

    }
  })
}, (v, k) => `createFlow.${k}`)
