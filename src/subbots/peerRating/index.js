import { Route } from '../../router.js';
import { addRecord, popRecord, rateRecord, RATES, START, WAIT_FOR_ITEM, RATING, aspects, getSession, PeerRatingSession } from './store.js';
import R from 'ramda';
import { utils as telegramUtils } from '../../telegram.js';
const winston = require('winston');
import Promise from 'bluebird';

const RATE = 'rate';
const CREATE = 'create';
const roles = [RATE, CREATE];

const VOICE = 'voice';
const TEXT = 'text';


const recordTypes = [VOICE, TEXT];

const messageType = msg => recordTypes.filter(t => !!msg[t])[0];

const msgToRecord = msg => {
  const type = messageType(msg);
  return { ...R.pick(recordTypes)(msg), fromId: msg.from.id, type };
};

export default
class PeerRating extends Route {
  getInitialSession() {
    return {
      step: START
    }
  }
  welcome() {
    return 'welcome to PeerRating bot.';
  }
  onEnter(ctx) {
    this.askForItem(ctx);
  }
  setStep(ctx, step) {
    ctx.state.session.step = step;
    return ctx.state.session.save();
  }
  askForItem(ctx) {
    return this.setStep(ctx, WAIT_FOR_ITEM).then(() => {
      this.sendMessage(ctx, 'Send your voice or text message to rate'); // and listen in on('message')
    }).catch(winston.error);
  }
  askForRole(ctx) {
    this.sendMessage(ctx, 'Send /next for next item, /create to add your own item or /back to exit');
  }
  aspectReplyOpts(aspect) {
    return {
      reply_markup: {
        inline_keyboard: [RATES.map(r => ({
          callback_data: [String(r), aspect.name].join(':'), // be aware that a bad client can send arbitrary data in this field // TODO can also have record here to have a 'stale record' message
          text: String(r), // TODO texts like 'poor', 'good' etc,
          hide_keyboard: true
        }))]
      }
    };
  }
  sendAspectToRate(ctx, aspect) {
    return ctx.reply(aspect.description, this.aspectReplyOpts(aspect))
  }
  initNextRating(ctx) {
    const fromId = telegramUtils.getFromId(ctx);
    const chatId = telegramUtils.getChatId(ctx);
    const { session } = ctx.state;
    if (session.step === RATING) {
      return popRecord(fromId).then(record => {
        winston.debug(`got next record for user ${fromId}: ${JSON.stringify(record)}`);
        if (record) {

          const handlers = {
            [VOICE](record) {
              return ctx.replyWithVoice(record[VOICE].file_id);
            },
            [TEXT](record) {
              return ctx.reply(record[TEXT]);
            }
          };
          const handler = handlers[record.type];
          if (handler) {
            const firstAspect = aspects[0];
            return handler(record)
              .then(() => session.update({recordToRateId: record._id}))
              .then(() => this.sendAspectToRate(ctx, firstAspect))
              .catch(e => console.error(e));
          } else {
            const e = new Error('not recognized record type', record);
            return Promise.reject(e);
          }
        } else {
          ctx.reply('no records to rate');
          this.endRating(ctx);
        }
      });
    } else {
      const err = `Wrong step for user ${fromId}, in sendNextRating. ${session.step} instead of ${RATE}`;
      return Promise.reject(err);
    }

  }
  endRating(ctx) {
    return this.setStep(ctx, START).then(() => {
      const chatId = telegramUtils.getChatId(ctx);
      return this.telegram.sendMessage(chatId, 'Rating done.')
    }).catch(winston.error);
  }
  constructor(name) {
    super(name);
    const telegram = this.telegram;
    const peerRating = this; // geez
    //telegram.hears(/^\/start/, function * () { // TODO CHECK IF RUNNING
    //  // TODO encapsulate, add PR or ask dev to improve it
    //  const msg = this.message;
    //  const chatId = msg.chat.id;
    //
    //  return telegram.sendMessage(chatId, `Choose a role`, {
    //    reply_markup: {
    //      keyboard: [roles.map(r => `/role ${r}`)],
    //      force_reply: true,
    //      hide_keyboard: true,
    //      one_time_keyboard: true
    //    }
    //  })
    //});
    telegram.use(function * (next) {
      const fromId = telegramUtils.getFromId(this);
      this.state.session = yield getSession(fromId);
      yield next;
    });
    telegram.hears('/next', function * () {
      const fromId = telegramUtils.getFromId(this);
      const { session } = this.state;
      if (session.step === START) {
        peerRating.setStep(this, RATING).then(() => {
          return peerRating.initNextRating(this);
        }).catch(winston.error);
      } else {
        winston.error(`Wrong step for user ${fromId}, in initNextRating. ${session.step} instead of ${START}`);
      }
    });
    telegram.hears('/create', function * () {
      peerRating.askForItem(this);
    });
    telegram.on('message', function * (next) {
      const msg = this.message;
      const fromId = telegramUtils.getFromId(this);
      const { session } = this.state;
      if (session.step === WAIT_FOR_ITEM) {
        const type = messageType(msg);
        if (!type) this.reply('unsupported message type');
        else {
          addRecord(msgToRecord(msg))
            .then(() => peerRating.setStep(this, RATING))
            .then(() => this.reply('Record added.'))
            .then(() => peerRating.initNextRating(this)).catch(winston.error);
        }
      } else if (session.step === RATING) {
        // TODO add arbitrary message to LAST rated item !!!
      }
    });
    telegram.on('callback_query', function * () {
      const fromId = telegramUtils.getFromId(this);
      const { session } = this.state;
      const { callbackQuery } = this;
      const { message: { message_id: messageId, chat: { id: chatId } } } = callbackQuery;
      if (session.step === RATING) {
        const recordId = session.recordToRateId;
        const [rateString, aspectName] = callbackQuery.data.split(':');
        const rateValue = Number(rateString);
        // TODO validate aspect
        rateRecord(recordId, aspectName, rateValue, fromId).then((record) => {
          if (aspects.map(a => a.name).indexOf(aspectName) === -1) throw new Error(`No such aspect: ${aspectName}`);
          const nextAspect = aspects[R.findIndex(R.propEq('name', aspectName))(aspects) + 1];
          return telegram.editMessageText(chatId, messageId,
            `${aspectName} rated: ${rateValue}\nnext: ${nextAspect ? nextAspect.description : 'done'}`) // TODO we can have all rates as well
            .then(() => this.answerCallbackQuery(`Aspect ${aspectName} rated!`))
            .then(() => nextAspect ?
              telegram.editMessageReplyMarkup(chatId, messageId, peerRating.aspectReplyOpts(nextAspect).reply_markup) :
              peerRating.setStep(this, START).then(() => peerRating.askForRole(this))
            );
        }).catch(winston.error);
      } else {
        winston.error(`Wrong step for user ${fromId}, in callback_query. ${session.step} instead of ${RATING}`);
      }

    });
  }
}
