export default class Sender {
  reply(to, genericMsg) {throw new Error('not defined')};
  notify(to, genericMsg) {throw new Error('not defined')};
  flush(to) {throw new Error('not defined')}; // pop all messages in notify() queue
}
