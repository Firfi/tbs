import { utils as telegramUtils } from '../telegram.js'
import Convo from './convo';
import { getConvo } from './convoSession.js';
import { getByTelegramId as getUserByTelegramId } from '../model/user.js';
import sender from '../sender/index.js';
import { UserMessage, messageTypes } from '../chatModel/messages'
const toPairs = require('lodash/toPairs');

export default class TelegramConvo extends Convo { // fetch session from message telegram-way

  async reply(replyMessage, opts) { // TODO in interface
    return await sender.reply(this.message.chatId, replyMessage, opts);
  }

}

TelegramConvo.getGenericMessage = async function(context) { // get 'inner api' message from telegram-specific message
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
  const user = await TelegramConvo.getGenericUser(context);
  return new UserMessage(genericType, msg[telegramType], user, msg.chat.id);
};

// TelegramConvo.getGenericConvo = async function(context) { // get convo (current state machine client) from session
//   return await getConvo(`${telegramUtils.getChatId(context)}:${telegramUtils.getFromId(context)}`);
// };

TelegramConvo.getConvoKey = (context) => {
  return `${telegramUtils.getChatId(context)}:${telegramUtils.getFromId(context)}`; 
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
