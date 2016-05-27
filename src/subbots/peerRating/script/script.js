import { Say, Input } from './actions.js';
import { utils as telegramUtils } from '../../../telegram.js';


let listeners = {};
let currentListener;

const responderApi = (telegram) => ({
  say(ctx, what, opts) {
    const chatId = telegramUtils.getChatId(ctx); // chatId - telegram related thing
    telegram.sendMessage(chatId, what, opts);
  },
  listen(name, ctx, cb) {
    const listener = listeners[name];
    currentListener = name;
    if (!listener) {
      listeners[name] = telegram.use(function * (next) {
        const chatId = telegramUtils.getChatId(this);
        if (chatId !== telegramUtils.getChatId(ctx)) return yield next;
        if (currentListener !== name) return yield next;
        let _done = false;
        const done = () => _done = true;
        cb({ message: this.message, done }); // TODO with promises
        if (!done) yield next;
      }) || true;
    }

  }
});

export const script1 = (telegram) => {
  const responder = responderApi(telegram);
  return [
    new Say({ what: 'q1', name: 'sayOne' }),
    new Input({ name: 'inputOne' })
    // inject a telegram responding/requesting API there but hide telegram itself and connect them with each other in line
  ].map(c => c.withResponder(responder)).reduceRight((v, acc) => [[v.withNext(acc[1])].concat(acc[0]), v], [[], undefined]);
};
