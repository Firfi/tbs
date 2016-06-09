// generic message types declaration

import { capitalizeFirstLetter } from '../utils/string';

const VOICE = 'voice';
const TEXT = 'text';
const VIDEO = 'video';
const PHOTO = 'photo';

export const messageTypes = { VOICE, TEXT, VIDEO, PHOTO };
const allowedMessageTypes = Object.values(messageTypes);

class Message {
  constructor(type, content) { // content is text or file ID
    if (allowedMessageTypes.indexOf(type) === -1) throw new Error(`Wrong message type: ${type}`);
    this.type = type;
    this.content = content; // i.e. this.text = content

    allowedMessageTypes.forEach(t => {
      this[`is${capitalizeFirstLetter(t)}`] = () => t === type;
    });

  }
}

export class ReplyMessage extends Message {
  constructor(type, content) {
    super(type, content);
  }
}

export class TextReplyMessage extends ReplyMessage {
  constructor(text) {
    super(messageTypes.TEXT, text);
  }
}

export class UserMessage extends Message {
  constructor(type, content, user, chatId) {
    super(type, content);
    this.user = user;
    this.chatId = chatId;
  }
}
