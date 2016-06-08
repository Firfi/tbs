import { bot as telegram } from '../telegram.js';
import { messageTypes } from '../chatModel/messages.js';
import Sender from './sender.js';

export default class TelegramSender extends Sender {
  reply(to, msg, opts) {
    const handlers = { // generic -> telegram method
      [messageTypes.VOICE]: telegram.sendVoice,
      [messageTypes.VIDEO]: telegram.sendVideo,
      [messageTypes.TEXT]: telegram.sendMessage,
      [messageTypes.PHOTO]: telegram.sendPhoto
    };
    return handlers[msg.type](to, msg.content, opts);
  }
}
