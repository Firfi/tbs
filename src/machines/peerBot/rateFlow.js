const mapKeys = require('lodash/mapKeys');
const mapValues = require('lodash/mapValues');
const winston = require('winston');
import sender from '../../sender/index';
import R from 'ramda';
import { sendQueuedNotifications, notifyAboutRate } from './rateNotifier';

import { addRecord, popRecord, getRecord, rateRecord, aspects, getSession, getSessionPromise, RATES,
  storeRateNotification, popRateNotifications, PeerRatingRateNotification, ratesForRecord } from './store.js';

import { ReplyMessage } from '../../chatModel/messages';

import globalCommands from './globalCommands';

const recordToReplyMessage = record => {
  return new ReplyMessage(record.type, record[record.type]);
};

function aspectReplyOpts(aspect) {
  return {
    reply_markup: {
      inline_keyboard: [RATES.map(r => ({
        callback_data: [String(r), aspect.name].join(':'), // be aware that a bad client can send arbitrary data in this field // TODO can also have record here to have a 'stale record' message
        text: String(r) // TODO texts like 'poor', 'good' etc,
      }))],
      hide_keyboard: true
    }
  };
}

async function sendAspectToRate(convo, aspect) {
  await convo.reply(aspect.description, aspectReplyOpts(aspect));
}

const onEnterFallback = state => {
  if (state._onEnter) {
    const f = state._onEnter;
    state._onEnter = async function(client) {
      console.warn('wrapper stuff?')
      try {
        await f.bind(this)(client);
      } catch (e) {
        console.error(e);
        await client.convo.reply('Unexpected error');
        this.transition(client, 'welcome');
        this.emit('handle.done', client.convo);
        throw e;
      }
    };
  }
  return state;
};

export default mapValues(mapKeys({
  init: {
    async _onEnter(client) {
      this.transition(client, 'rateFlow.intro');
      this.emit('handle.done', client.convo);
    }
  },

  intro: {
    async _onEnter(client) {
      await client.convo.reply('Item to rate: (intro text)');
      this.transition(client, 'rateFlow.rateWIP');
      this.emit('handle.done', client.convo);
    }
  },

  rateWIP: globalCommands({
    _reset() {},
    async _onEnter(client) {
      const telegramFromId = client.convo.message.user.telegramId;
      const record = await popRecord(client.convo.message.user.telegramId);
      winston.debug(`got next record for user ${telegramFromId}: ${JSON.stringify(record)}`);
      if (record) {
        const replyMessage = recordToReplyMessage(record);
        await client.convo.reply(replyMessage);
        const firstAspect = aspects[0];
        client.recordToRateId = record._id; // TODO 1
        await sendAspectToRate(client.convo, firstAspect);
        this.emit('handle.done', client.convo); // TODO 1
      } else {
        await client.convo.reply('no records to rate');
        this.transition(client, 'welcome');
      }
      // TODO set timeout to move back
    },
    async '*'(client, action_, convo) {
      try {
        if (convo.message.isInlineKeyboard()) {
          const recordId = client.recordToRateId;
          const [rateString, aspectName] = convo.message.content.split(':');
          const rateValue = Number(rateString);
          const fromId = convo.message.user.telegramId;
          await rateRecord(recordId, aspectName, rateValue, fromId);
          if (aspects.map(a => a.name).indexOf(aspectName) === -1) throw new Error(`No such aspect: ${aspectName}`);
          const nextAspect = aspects[R.findIndex(R.propEq('name', aspectName))(aspects) + 1];
          // await sender.answerCallbackQuery(`Aspect ${aspectName} rated!`)) TODO notify() thing in sender
          await sender.editMessageText(
            convo.message.replyMessage.chatId,
            convo.message.replyMessage.id,
            `${aspectName} rated: ${rateValue}\nnext: ${nextAspect ? nextAspect.description : 'done!'}`,
            nextAspect && aspectReplyOpts(nextAspect)
          );
          if (!nextAspect) {
            this.transition(client, 'rateFlow.outro');
          }
        } else {
          await convo.reply('Please rate an item with inline keyboard');
        }


      } catch(e) { // TODO generic error handling
        console.error(e);
        this.transition(client, 'welcome');
        this.emit('handle.done', client.convo);
        throw e;
      }

    }
  }),
  outro: {
    async _onEnter(client) {
      await client.convo.reply('Outro text here...');
      this.transition(client, 'rateFlow.checkFeedback');
    }
  },
  checkFeedback: {
    async _onEnter(client) {
      const recordId = client.recordToRateId;
      const fromId = client.convo.message.user.telegramId;
      const record = await getRecord(recordId);
      await notifyAboutRate(record, fromId);
      await sendQueuedNotifications(fromId);
      this.transition(client, 'welcome');
    },
    _onExit(client) { // cleanup
      delete client.recordToRateId;
    }
  }
}, (v, k) => `rateFlow.${k}`), (v) => onEnterFallback(v))
