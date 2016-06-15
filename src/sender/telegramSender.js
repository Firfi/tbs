import { bot as telegram } from '../telegram.js';
import { messageTypes, TextReplyMessage } from '../chatModel/messages.js';
import Sender from './sender.js';
import TelegramConvo from '../router/telegramConvo';

import R from 'ramda';

export default class TelegramSender extends Sender {
  async reply(to, msg, opts) {
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
      [messageTypes.PHOTO]: R.pipe(R.last, R.prop('file_id'))
    };

    try {
      return TelegramConvo.getMessageId({
        message: await handlers[msg.type].bind(telegram)(to, (mappers[msg.type] || R.identity)(msg.content), opts)
      });
    } catch(e) {console.error(e)}

  }
  async editMessageText(chatId, msgId, text, opts) {
    return await telegram.editMessageText(chatId, msgId, text, opts);
  }
  async editMessageReplyMarkup(chatId, msgId, opts) {
    return await telegram.editMessageReplyMarkup(chatId, msgId, opts);
  }
}
