const mapKeys = require('lodash/mapKeys');
const winston = require('winston');
import sender from '../../sender/index';
import R from 'ramda';

import { addRecord, popRecord, rateRecord, aspects, getSession, getSessionPromise, RATES,
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

export default mapKeys({
  init: {
    async _onEnter(client) {
      this.transition(client, 'rateFlow.waitForRate');
    },
    async '*'(client, convo) {
      this.transition(client, 'rateFlow.waitForRate');
    }
  },

  waitForRate: globalCommands({
    _reset() {},
    async _onEnter(client) {
      try {
        await client.convo.reply('Item to rate:');
        const telegramFromId = client.convo.message.user.telegramId;
        const record = await popRecord(client.convo.message.user.telegramId);
        winston.debug(`got next record for user ${telegramFromId}: ${JSON.stringify(record)}`);
        if (record) {
          console.warn('record', record)
          const replyMessage = recordToReplyMessage(record);
          await client.convo.reply(replyMessage);
          const firstAspect = aspects[0];
          client.recordToRateId = record._id; // TODO 1
          await sendAspectToRate(client.convo, firstAspect);
          this.emit('handle.done', client.convo); // TODO 1
        } else {
          client.convo.reply('no records to rate');
          this.transition(client, 'welcome');
        }
      } catch (e) {
        console.error(e);
        throw new Error(e);
      }
      // TODO set timeout to move back
    },
    _onExit(client) {
      delete client.recordToRateId;
      this.emit('handle.done', client.convo);
    },
    async '*'(client, action_, convo) {
      try {
        if (convo.message.isInlineKeyboard()) {
          console.warn('convo, ',convo)
          const recordId = client.recordToRateId;
          const [rateString, aspectName] = convo.message.content.split(':');
          const rateValue = Number(rateString);
          const fromId = convo.message.user.telegramId;
          const record = await rateRecord(recordId, aspectName, rateValue, fromId);
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
              
          }

          return;
          return Promise.all([
            telegram.editMessageText(chatId, messageId,
              `${aspectName} rated: ${rateValue}\nnext: ${nextAspect ? nextAspect.description : 'done!'}`) // TODO we can have all rates as well
              .then(() => this.answerCallbackQuery(`Aspect ${aspectName} rated!`))
              .then(() => nextAspect ?
                peerRating.setStep(this, START).then(() => peerRating.askForRole(this))
                  .then(() => {
                    return popRateNotifications(fromId).then(notificationsWithRecords => {
                      winston.debug(`got records/notifications for rate notifications from polling ${notificationsWithRecords.length}`);
                      return Promise.all(notificationsWithRecords.map(({ record, notification }) => {
                        return peerRating.sendRateNotification(record, notification.ratedById, fromId);
                      }));
                    });
                  }) // poll waiting notifications logic here
              ),
            // and notify rated user // record.fromId
            !nextAspect ? peerRating.notifyAboutRate(this, record) : Promise.resolve()
          ]);
          // const record = genericMessageToRecord(convo.message);
          // await addRecord(record);
          // await convo.reply('Record added.');
          // this.transition(client, 'welcome');
          // this.emit('handle.done');
        }

      } catch(e) { // TODO generic error handling
        console.error(e);
      }

    }
  })
}, (v, k) => `rateFlow.${k}`)
