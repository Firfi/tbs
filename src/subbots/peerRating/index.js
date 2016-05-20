import { Route } from '../../router.js';
import { addRecord, popRecord, rateRecord, getRatesFor, RATES, aspects } from './store.js';
import R from 'ramda';
import { utils as telegramUtils } from '../../telegram.js';
const winston = require('winston');
import Promise from 'bluebird';

const RATE = 'rate';
const CREATE = 'create';
const roles = [RATE, CREATE];

const VOICE = 'voice';
const TEXT = 'text';

const START = 'start';
const WAIT_FOR_ITEM = 'waitForItem'; // when we listen for user input with item to be rated
const RATING = 'rating'; // and implicit step RECORD_RATING when there's RATING and record to rate id involved


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
  askForItem(ctx) {
    this.updateSession(ctx, {step: WAIT_FOR_ITEM});
    this.sendMessage(ctx, 'Send your voice or text message to rate'); // and listen in on('message')
  }
  askForRole(ctx) {
    this.sendMessage(ctx, 'Send /next for next item, /create to add your own item or /back to exit');
  }
  getSession(uid) {
    return this.session[uid] || this.getInitialSession();
  }
  setSession(uid, s) {
    this.session[uid] = s;
  }
  updateSession(ctx, s) {
    const fromId = telegramUtils.getFromId(ctx);
    const session = this.getSession(fromId);
    this.setSession(fromId, Object.assign(session, s));
  }
  sendNextRating(ctx) {
    const fromId = telegramUtils.getFromId(ctx);
    const chatId = telegramUtils.getChatId(ctx);
    const session = this.getSession(fromId);
    if (session.step === RATING) {
      popRecord(fromId).then(record => {
        winston.debug(`got next record for user ${fromId}: ${JSON.stringify(record)}`);
        if (record) {
          const replyOpts = (aspect) => ({
            reply_markup: {
              inline_keyboard: [RATES.map(r => ({
                callback_data: [String(r), aspect].join(':'), // be aware that a bad client can send arbitrary data in this field
                text: String(r), // TODO texts like 'poor', 'good' etc,
                hide_keyboard: true
              }))]
            }
          });
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
            handler(record).then(() => { // record sent, and send aspects:
              this.updateSession(ctx, {recordToRateId: record.id});
              aspects.reduce((p, { name, description }) => { // otherwise sending order is undefined
                return p.then(() => ctx.reply(description, replyOpts(name)));
              }, Promise.resolve()).catch(e => winston.error(e));
            }).catch(e => console.error(e));
          } else {
            throw new Error('not recognized record type', record);
          }
        } else {
          ctx.reply('no records to rate');
          this.endRating(ctx);
        }
      });
    } else {
      winston.error(`Wrong step for user ${fromId}, in sendNextRating. ${session.step} instead of ${RATE}`);
    }

  }
  endRating(ctx) {
    this.updateSession(ctx, {step: START});
    const chatId = telegramUtils.getChatId(ctx);
    this.telegram.sendMessage(chatId, 'Rating done.')
  }
  constructor(name) {
    super(name);
    const telegram = this.telegram;
    this.session = {}; // userId: session stuff TODO persistance
    this.state = {
      roles: {
        // userId: role
      }
    };
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
    telegram.hears('/next', function * () {
      const fromId = telegramUtils.getFromId(this);
      const session = peerRating.getSession(this);
      if (session.step === START) {
        peerRating.updateSession(this, {step: RATING});
        peerRating.sendNextRating(this);
      } else {
        winston.error(`Wrong step for user ${fromId}, in sendNextRating. ${session.step} instead of ${START}`);
      }
    });
    telegram.hears('/create', function * () {
      peerRating.askForItem(this);
    });
    telegram.on('message', function * (next) {
      const msg = this.message;
      const fromId = telegramUtils.getFromId(this);
      const session = peerRating.getSession(fromId); // TODO incapsulate in middleware
      if (session.step === WAIT_FOR_ITEM) {
        const type = messageType(msg);
        if (!type) this.reply('unsupported message type');
        else {
          addRecord(msgToRecord(msg)).then(() => {
            peerRating.updateSession(this, {step: RATING});
            this.reply('Record added.').then(() => {
              peerRating.sendNextRating(this);
            });
          }).done();
        }
      } else if (session.step === RATING) {
        // TODO add arbitrary message to LAST rated item !!!
      }
    });
    telegram.on('callback_query', function * () {
      const fromId = telegramUtils.getFromId(this);
      const session = peerRating.getSession(fromId);
      const { callbackQuery } = this;
      const { message: { message_id: messageId, chat: { id: chatId } } } = callbackQuery;
      if (session.step === RATING) {
        const recordId = session.recordToRateId;
        const [rateString, aspect] = callbackQuery.data.split(':');
        const rateValue = Number(rateString);
        // TODO validate aspect
        rateRecord(recordId, aspect, rateValue, fromId).then((rate) => {
          /*telegram.editMessageReplyMarkup(chatId, messageId, {inline_keyboard: []}) No need to do it! client hide it anyway*/
          Promise.resolve().then((message) => {
            telegram.editMessageText(chatId, messageId, `${aspect} rated: ${rateValue}`)
          }).catch(e => console.error(e)); // TODO if several messages, only one will be edited. ADD ALL MESSAGES INDEX!
          // TODO we can also add 'next' button instead now
          this.answerCallbackQuery(`Aspect ${aspect} rated!`);
          getRatesFor(recordId, fromId).then(rates => {
            const uniqRatedAspects = R.compose(R.uniq, R.map(R.prop('aspect')))(rates);
            const allRatedNow = uniqRatedAspects.length === aspects.length;
            if (allRatedNow) {
              peerRating.updateSession(this, {step: START});
              peerRating.askForRole(this);
            }
          }).catch(e => winston.error(e));
        });
      } else {
        winston.error(`Wrong step for user ${fromId}, in callback_query. ${session.step} instead of ${RATING}`);
      }

    });
  }
}
