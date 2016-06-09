// convo object for states talking with router and user, i.e. changing sessions, sending responses.
// formerly, context of conversation, presented more explicitly

import { getConvo, lock, unlock } from './convoSession.js';
const clone = require('lodash/clone');

export default class Convo {

  //
  // getGenericMessage(context) {
  //   throw new Error('not defined');
  // }
  //
  // getGenericUser(context) {
  //   throw new Error('not defined');
  // }

  constructor(state, message) {

    this.state = clone(state); // this.getGenericConvo(context);
    this.state.convo = this;
    this.message = message; // this.getGenericMessage(context); // currentMessage
  }

  async lock() {
    await lock(this.state.sessionKey);
  }

  async unlock() {
    await unlock(this.state.sessionKey);
  }

  locked() {
    return this.state.locked;
  }

}

Convo.getConvoKey = function(context) {
  throw new Error('not defined');
};

Convo.getGenericConvo = async function(context) {
  return await getConvo(this.getConvoKey(context));
};
