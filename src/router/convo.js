// convo object for states talking with router and user, i.e. changing sessions, sending responses.
// formerly, context of conversation, presented more explicitly

import { getConvo, lock, unlock } from './convoSession.js';

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
    this.state = state; // this.getGenericConvo(context);
    this.message = message; // this.getGenericMessage(context); // currentMessage
  }

  async lock() {
    lock(this.state.id);
  }

  async unlock() {
    unlock(this.state.id);
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
