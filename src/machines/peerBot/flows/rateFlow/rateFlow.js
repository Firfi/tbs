const mapKeys = require('lodash/mapKeys');
const mapValues = require('lodash/mapValues');
const winston = require('winston');
import sender from '../../../../sender/index';
import R from 'ramda';
import { sendQueuedNotifications, notifyAboutRate } from './rateNotifier';
import keyboards from './views/keyboards';
import postRateCommands from './postRateCommands';
import { attachCommandHandlers } from '../../../utils/commands';
import { utils as telegramUtils } from '../../../../telegram';
const { hideKeyboard } = telegramUtils;
import globalCommands, { menuKb } from '../../globalCommands';
import wrap from '../../../utils/compose';
import messages from './views/messages';


import { popRecord, getRecord, rateRecord, aspects, RATES } from '../../store.js';

import { ReplyMessage } from '../../../../chatModel/messages';

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
      await client.convo.reply(messages().itemToRate);
      this.transition(client, 'rateFlow.rateWIP');
      this.emit('handle.done', client.convo);
    }
  },

  rateWIP: {
    _reset() {},
    async _onEnter(client) {
      const telegramFromId = client.convo.message.user.telegramId;
      const record = await popRecord(client.convo.message.user.telegramId);
      winston.debug(`got next record for user ${telegramFromId}: ${JSON.stringify(record)}`);
      if (record) {
        const replyMessage = recordToReplyMessage(record);
        await client.convo.reply(replyMessage); // hideKeyboard because of client bug when it shows old hidden KB // we can't hide it and change at the same time
        const firstAspect = aspects()[0];
        client.recordToRateId = record._id; // TODO 1
        await sendAspectToRate(client.convo, firstAspect);
        this.emit('handle.done', client.convo); // TODO 1
      } else {
        await client.convo.reply(messages().noRecordsToRate);
        this.transition(client, 'welcome');
      }
      // TODO set timeout to move back
    },
    '*': wrap(async function(ctx, next) {
      const { convo, client, machina } = ctx;
      try {
        if (convo.message.isInlineKeyboard()) {
          const recordId = client.recordToRateId;
          const [rateString, aspectName] = convo.message.content.split(':');
          const rateValue = Number(rateString);
          const fromId = convo.message.user.telegramId;
          await rateRecord(recordId, aspectName, rateValue, fromId);
          const aspectsFetched = aspects();
          if (aspectsFetched.map(a => a.name).indexOf(aspectName) === -1) throw new Error(`No such aspect: ${aspectName}`);
          const nextAspect = aspectsFetched[R.findIndex(R.propEq('name', aspectName))(aspectsFetched) + 1];
          // await sender.answerCallbackQuery(`Aspect ${aspectName} rated!`)) TODO notify() thing in sender
          await sender.editMessageText(
            convo.message.replyMessage.chatId,
            convo.message.replyMessage.id,
            `${aspectName} rated: ${rateValue}\nnext: ${nextAspect ? nextAspect.description : 'done!'}`,
            nextAspect && aspectReplyOpts(nextAspect)
          );
          if (!nextAspect) {
            machina.transition(client, 'rateFlow.outro');
          }
        } else {
          await convo.reply(messages().rateWIPWrongEvent);
        }


      } catch(e) {
        console.error(e);
        this.transition(client, 'welcome');
        this.emit('handle.done', client.convo);
        throw e;
      }

    })
  },
  outro: {
    async _onEnter(client) {
      await client.convo.reply(messages().outro);
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
      this.transition(client, 'rateFlow.postRateMenu');
    },
    _onExit(client) { // cleanup
      delete client.recordToRateId;
    }
  },
  postRateMenu: {
    '*': wrap(attachCommandHandlers({
      async [postRateCommands.CREATE](ctx) {
        const { client, convo, machina } = ctx;
        machina.transition(client, 'createFlow.init');
      },
      async [postRateCommands.MORE_RATE](ctx) {
        const { client, convo, machina } = ctx;
        machina.transition(client, 'rateFlow.init');
      },
      async [postRateCommands.START](ctx) {
        const { client, convo, machina } = ctx;
        machina.transition(client, 'welcome');
      },
      async [postRateCommands.STATS](ctx) {
        const { client, convo, machina } = ctx;
        const { keyboard } = keyboards().postRateMenu;
        convo.reply('No stats state yet! todo.', keyboard);
      }
    })),
    async _onEnter(client) {
      const { message, keyboard } = keyboards().postRateMenu;
      await client.convo.reply(message, keyboard);
      // this.transition(client, 'welcome'); // TODO
    }
  }
}, (v, k) => `rateFlow.${k}`), (v) => onEnterFallback(v))
