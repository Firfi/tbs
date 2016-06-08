// convo object for states talking with router and user, i.e. changing sessions, sending responses.
// formerly, context of conversation, presented more explicitly

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

}

Convo.getGenericConvo = async function(context) {
  console.warn('ggc', this);
};
