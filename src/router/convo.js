// convo object for states talking with router and user, i.e. changing sessions, sending responses.
// formerly, context of conversation, presented more explicitly

import sender from '../sender/index.js';
import { UserMessage, messageTypes } from '../chatModel/messages'
const toPairs = require('lodash/toPairs');

import { getByTelegramId as getUserByTelegramId } from '../model/user.js';


export class ConvoSessionDB {
  getConvo(key) { // key is uid, uid:chatid, system:uid:chatid (where system is telegram/facebook) etc.

  }
}

export class Convo {

  getGenericConvo(context) {
    throw new Error('not defined');
  }

  getGenericMessage(context) {
    throw new Error('not defined');
  }

  getGenericUser(context) {
    throw new Error('not defined');
  }

  constructor(context) {
    this.state = this.getGenericConvo(context);
    this.message = this.getGenericMessage(context); // currentMessage
  }

}



export class TelegramConvo extends Convo { // fetch session from message telegram-way

  getGenericConvo(context) {
    return context.session.convo || {locked: false}; // TODO get it from convo session DB, not using telegraf features
  }

  getGenericMessage(context) {
    const msg = context.message;
    const typeMap = { // telegram msg field -> generic message type
      'text': messageTypes.TEXT,
      'voice': messageTypes.VOICE,
      'video': messageTypes.VIDEO,
      'photo': messageTypes.PHOTO
    };
    const pair = toPairs(typeMap).find(p => msg[p[0]]);
    if (!pair) throw new Error("Can't find valid message type for message:", msg);
    const telegramType = pair[0];
    const genericType = pair[1];
    return new UserMessage(genericType, msg[telegramType], this.getGenericUser(context), msg.chatId);
  }

  async getGenericUser(context) {
    return await getUserByTelegramId(context.fromId);
  }

  constructor(context) { // serialized convo is taken from session provided by telegraf
    super(context);
  }

  reply(replyMessage, opts) {
    return sender.reply(this.message.chatId, replyMessage, opts);
  }

}
