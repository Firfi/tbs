import { bot as telegram } from '../../telegram.js';
import { addRecord, popRecord, rateRecord, RATES } from './store.js';
import R from 'ramda';

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
class PeerRating {
  welcome() {
    return 'welcome to PeerRating bot. type /start and or select a role with /role rate or /role create';
  }
  constructor() {
    this.state = {
      roles: {
        // userId: role
      }
    };
    const peerRating = this; // geez
    telegram.hears(/^\/start/, function * () { // TODO CHECK IF RUNNING
      // TODO encapsulate, add PR or ask dev to improve it
      this.state.done = true;
      const msg = this.message;
      const chatId = msg.chat.id;

      return telegram.sendMessage(chatId, `Choose a role`, {
        reply_markup: {
          keyboard: [roles.map(r => `/role ${r}`)],
          force_reply: true,
          hide_keyboard: true,
          one_time_keyboard: true
        }
      })
    });
    telegram.hears(/\/role (\w+)/, function * () {
      // TODO encapsulate, add PR or ask dev to improve it
      this.state.done = true;
      const msg = this.message;
      const chatId = msg.chat.id;
      const fromId = msg.from.id;
      const role = this.match[1];
      if (!R.contains(role, roles))
        return telegram.sendMessage(chatId, `wrong role given: ${role}, options are: ${roles.join(', ')}`);
      peerRating.state.roles[fromId] = role;
      this.reply(`role selected: ${role}`);
      if (role === RATE) {
        // TODO !!! ended here
      }
    });
    telegram.on('message', function * (next) {
      if (this.state.done) return;
      const msg = this.message;
      const fromId = msg.from.id;
      if (peerRating.state.roles[fromId] === CREATE) { // TODO encapsulate in middleware
        const type = messageType(msg);
        if (!type) this.reply('unsupported message type');
        else {
          addRecord(msgToRecord(msg)).then(() => {
            return this.reply('record added');
          }).done();
        }
      } else {
        yield next;
      }
    });
    telegram.hears('/next', function * () {
      // TODO encapsulate, add PR or ask dev to improve it
      this.state.done = true;
      const msg = this.message;
      const fromId = msg.from.id;
      const that = this;
      if (true || peerRating.state.roles[fromId] === RATE) { // TODO we actually don't need to keep a 'rate' state?
        popRecord().then(record => {
          if (record) {
            const replyOpts = {
              reply_markup: {
                inline_keyboard: [RATES.map(r => ({
                  callback_data: [record.id, String(r)].join(':'), // TODO Be aware that a bad client can send arbitrary data in this field
                  text: String(r), // TODO texts like 'poor', 'good' etc,
                  hide_keyboard: true
                }))]
              }
            };
            const handlers = {
              [VOICE](record) {
                return that.replyWithVoice(record[VOICE].file_id, replyOpts);
              },
              [TEXT](record) {
                return that.reply(record[TEXT], replyOpts);
              }
            };
            const handler = handlers[record.type];
            if (handler) {
              handler(record).catch(e => console.error(e));
            } else {
              throw new Error('not recognized record type', record);
            }
          } else {
            this.reply('no records to rate');
          }
        });
      }
    });
    telegram.on('callback_query', function * () {
      const { callbackQuery } = this;
      const { message: { message_id: messageId, chat: { id: chatId } } } = callbackQuery;
      const [recordId, rateString] = callbackQuery.data.split(':');
      rateRecord(recordId, Number(rateString)).then(() => {
        console.warn(chatId, messageId)
        telegram.editMessageReplyMarkup(chatId, messageId, {inline_keyboard: []})
          .catch(e => console.error(e)); // TODO if several messages, only one will be edited. ADD ALL MESSAGES INDEX!
        // TODO we can also add 'next' button instead now
        this.answerCallbackQuery('rated!');
      });
    });

    telegram.on('inline_query', function * (){
      console.warn('iq', this);
      // this.answerInlineQuery(result)
    })
  }
}
