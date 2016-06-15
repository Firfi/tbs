import { utils as telegramUtils } from '../telegram.js'
import Convo from './convo';
import { getByTelegramId as getUserByTelegramId } from '../model/user.js';
import sender from '../sender/index.js';
import { UserMessage, messageTypes } from '../chatModel/messages'
const toPairs = require('lodash/toPairs');

export default class TelegramConvo extends Convo { // fetch session from message telegram-way

  async reply(replyMessage, opts) { // TODO in interface
    return await sender.reply(this.message.chatId, replyMessage, opts);
  }

  async editMessageText(text, options) {
    return await sender.editMessageText(this.message.chatId, this.message.id, text, options);
  }

}

TelegramConvo.getMessageId = context => {
  const e = telegramUtils.getEvent(context);
  return e.id || e.message_id; // message_id for outgoing
};

TelegramConvo.getGenericMessage = async function(context) { // get 'inner api' message from telegram-specific message
  const msg = context.message;

  const messageId = TelegramConvo.getMessageId(context);
  const getTypeAndContentFromMessage = (msg) => {
    const typeMap = { // telegram msg field -> generic message type
      'text': messageTypes.TEXT,
      'voice': messageTypes.VOICE,
      'video': messageTypes.VIDEO,
      'photo': messageTypes.PHOTO,
      'location': messageTypes.LOCATION
    };
    const pair = toPairs(typeMap).find(p => msg[p[0]]);
    if (!pair) throw new Error("Can't find valid message type for message:", msg);

    const telegramType = pair[0];
    const genericType = pair[1];
    return [genericType, msg[telegramType]]
  };
  const [ type, content, replyMessage ] = msg ? getTypeAndContentFromMessage(msg) : await (async function() {
    const { callbackQuery } = context;
    const [ replyToType, replyToContent ] = getTypeAndContentFromMessage(callbackQuery.message);
    return [messageTypes.INLINE_KEYBOARD, callbackQuery.data, new UserMessage( // replyTo message
      replyToType,
      replyToContent,
      await TelegramConvo.getGenericUser(callbackQuery),
      telegramUtils.getChatId(callbackQuery),
      TelegramConvo.getMessageId(callbackQuery)
    )];
  })();
  const user = await TelegramConvo.getGenericUser(context);
  const chatId = telegramUtils.getChatId(context);
  return new UserMessage(type, content, user, chatId, messageId).repliedTo(replyMessage);
};

// TelegramConvo.getGenericConvo = async function(context) { // get convo (current state machine client) from session
//   return await getConvo(`${telegramUtils.getChatId(context)}:${telegramUtils.getFromId(context)}`);
// };

TelegramConvo.makeKey = (chatId, userId) => {
  return `${chatId}:${userId}`;
};

TelegramConvo.getConvoKey = (context) => {
  return TelegramConvo.makeKey(telegramUtils.getChatId(context), telegramUtils.getFromId(context));
};

TelegramConvo.getGenericUser = async function(context) { // get 'inner api' user from telegram-specific user
  return await getUserByTelegramId(telegramUtils.getFromId(context));
};

TelegramConvo.create = async function(context) {
  return new TelegramConvo(
    await TelegramConvo.getGenericConvo(context),
    await TelegramConvo.getGenericMessage(context)
  );
};
