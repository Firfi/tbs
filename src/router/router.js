const winston = require('winston');
winston.level = 'debug';
import { bot as telegram, utils as telegramUtils } from '../telegram.js';
import TelegramConvo from './telegramConvo';
import rootFsm from '../machines/rootFsm.js';
import { setConvo } from './convoSession';

const map = require('lodash/map');

export default class Router {
  constructor() {
    const router = this;
    telegram.use(function * (next) { // TODO Router also decides which system sent a message (telegram, facebook etc)
      const convo = yield TelegramConvo.create(this);
      yield router.route(convo);
      yield next;
    });
    rootFsm.on('transition', async function(opts) {
      const { convo } = opts.client;
      map(convo.state.__machina__, (v) => {
        v.currentActionArgs = [];
      });
      await setConvo(convo.state.sessionKey, convo.state);
    });
    rootFsm.on('handle.done', async function(convo) {
      map(convo.state.__machina__, (v) => {
        v.currentActionArgs = [];
      });
      await setConvo(convo.state.sessionKey, convo.state);
    });
  }
  async route(convo) {
    rootFsm.handle(convo.state, 'event', convo); // saving a state for async actions
  }
}
