import { bot as telegram } from '../telegram.js';
import { messageTypes, TextReplyMessage } from '../chatModel/messages.js';
import Sender from './sender.js';
import TelegramConvo from '../router/telegramConvo';
const identity = require('lodash/identity');

import R from 'ramda';

const addSpeakerPerson = speaker => message => {
  if (!speaker) return message;
  return `*${speaker.name}*\n${message}`;
};

const defaultOpts = opts => Object.assign({
  parse_mode: 'Markdown'
}, opts);

export default class TelegramSender extends Sender {
  async reply(to, msg, opts={}) {
    opts = defaultOpts(opts);
    if (typeof msg === 'string') {
      msg = new TextReplyMessage(msg, opts);
    }
    const handlers = { // generic -> telegram method
      [messageTypes.VOICE]: telegram.sendVoice,
      [messageTypes.VIDEO]: telegram.sendVideo,
      [messageTypes.TEXT]: telegram.sendMessage,
      [messageTypes.PHOTO]: telegram.sendPhoto
    };

    const mappers = {
      [messageTypes.VOICE]: R.prop('file_id'),
      [messageTypes.VIDEO]: R.prop('file_id'),
      [messageTypes.PHOTO]: R.pipe(R.last, R.prop('file_id')),
      [messageTypes.TEXT]: addSpeakerPerson(this.speaker)
    };

    try {
      return TelegramConvo.getMessageId({
        message: await handlers[msg.type].bind(telegram)(to, (mappers[msg.type] || R.identity)(msg.content), opts)
      });
    } catch(e) {console.error(e)}

  }
  async editMessageText(chatId, msgId, text, opts={}) {
    return await telegram.editMessageText(chatId, msgId, addSpeakerPerson(this.speaker)(text), defaultOpts(opts));
  }
  async editMessageReplyMarkup(chatId, msgId, opts) {
    return await telegram.editMessageReplyMarkup(chatId, msgId, opts);
  }
  withSpeaker(speaker) {
    class WithSpeaker extends TelegramSender {constructor() {super(); this.speaker = speaker;}}
    return new WithSpeaker();
  }
}
