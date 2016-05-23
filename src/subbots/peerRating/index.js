import { Route, BACK_COMMAND, HELP_COMMAND, MENU_COMMAND } from '../../router.js';
import { addRecord, popRecord, rateRecord, RATES, START, WAIT_FOR_ITEM, RATING,
  aspects, getSession, getSessionPromise,
  storeRateNotification, popRateNotifications, PeerRatingRateNotification, ratesForRecord } from './store.js';
import R from 'ramda';
import { utils as telegramUtils } from '../../telegram.js';
const { oneTimeKeyboard, hideKeyboard } = telegramUtils;
const winston = require('winston');
import Promise from 'bluebird';

const RATE = 'rate';
const CREATE = 'create';
const roles = [RATE, CREATE];

const VOICE = 'voice';
const TEXT = 'text';
const VIDEO = 'video';


const recordTypes = [VOICE, TEXT, VIDEO];

const messageType = msg => recordTypes.filter(t => !!msg[t])[0];

const msgToRecord = msg => {
  const type = messageType(msg);
  return { ...R.pick(recordTypes)(msg), fromId: msg.from.id, type };
};

const NEXT_COMMAND = '/next';
const CREATE_COMMAND = '/create';
const START_COMMAND = '/start';

const menuKb = oneTimeKeyboard([[MENU_COMMAND], [CREATE_COMMAND], [START_COMMAND]]);

export default
class PeerRating extends Route {
  getInitialSession() {
    return {
      step: START
    }
  }
  welcome() {
    return {
      layout: menuKb,
      message: 'welcome to PeerRating bot.'
    }
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
      this.sendMessage(ctx, 'Send your voice or text message to rate', hideKeyboard()); // and listen in on('message')
    }).catch(winston.error);
  }
  askForRole(ctx) {
    this.sendMessage(ctx,
      `Send ${NEXT_COMMAND} for next item, ${CREATE_COMMAND} to add your own item or ${BACK_COMMAND} to exit`,
      oneTimeKeyboard([[NEXT_COMMAND], [CREATE_COMMAND], [BACK_COMMAND]]))
  }
  aspectReplyOpts(aspect) {
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
  sendAspectToRate(ctx, aspect) {
    return this.sendMessage(ctx, aspect.description, this.aspectReplyOpts(aspect)).then
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
              return ctx.replyWithVoice(record[VOICE].file_id, hideKeyboard());
            },
            [VIDEO](record) {
              return ctx.replyWithVideo(record[VIDEO].file_id, hideKeyboard());
            },
            [TEXT](record) {
              return ctx.reply(record[TEXT], hideKeyboard());
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
      return this.telegram.sendMessage(chatId, 'Rating done.').then(() => this.askForRole(ctx));
    }).catch(winston.error);
  }
  sendRateNotification(record, ratedById) {
    // TODO actually not uid but chat id but we don't store it for now. session ? also user could close chat.
    winston.debug(`rates notification going for record ${record._id} and user ${record.fromId}`);
    const rates = ratesForRecord(record, ratedById);
    return this.telegram.sendMessage(record.fromId, `Your item have been rated: \n${rates.map(rate => `${rate.aspect}: ${rate.rate}`).join('\n')}`);
  }
  notifyAboutRate(ctx, record) {
    const ratedById = telegramUtils.getFromId(ctx);
    const uid = record.fromId;
    return getSessionPromise(uid).then(session => {
      if (session && session.step === RATING) {
        return storeRateNotification(record, ratedById);
      } else {
        return this.sendRateNotification(record, ratedById);
      }
    });
  }
  constructor(name) {
    super(name);
  }
  init(parent) {
    super.init(parent);
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
    telegram.hears(NEXT_COMMAND, function * () {
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
    telegram.hears(CREATE_COMMAND, function * () {
      peerRating.askForItem(this);
    });
    telegram.hears(START_COMMAND, function * () {
      peerRating.setStep(this, START).then(() => {
        peerRating.sendWelcome(this);
      });
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
          return Promise.all([
            telegram.editMessageText(chatId, messageId,
              `${aspectName} rated: ${rateValue}\nnext: ${nextAspect ? nextAspect.description : 'done'}`) // TODO we can have all rates as well
              .then(() => this.answerCallbackQuery(`Aspect ${aspectName} rated!`))
              .then(() => nextAspect ?
                telegram.editMessageReplyMarkup(chatId, messageId, peerRating.aspectReplyOpts(nextAspect).reply_markup) :
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
        }).catch(winston.error);
      } else {
        winston.error(`Wrong step for user ${fromId}, in callback_query. ${session.step} instead of ${RATING}`);
      }

    });
  }
}
