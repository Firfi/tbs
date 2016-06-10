import { bot as telegram } from '../telegram.js';
import { messageTypes, TextReplyMessage } from '../chatModel/messages.js';
import Sender from './sender.js';

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
    return await handlers[msg.type].bind(telegram)(to, msg.content, opts);
  }
  async editMessageText(chatId, msgId, text, opts) {
    return await telegram.editMessageText(chatId, msgId, text, opts);
  }
}
