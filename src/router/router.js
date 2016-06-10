// import Route, { routes } from './subbots/router.js';
const winston = require('winston');
winston.level = 'debug';
import { bot as telegram, utils as telegramUtils } from '../telegram.js';
// import compose from 'koa-compose';
import R from 'ramda';
import TelegramConvo from './telegramConvo';
import rootFsm from '../machines/rootFsm.js';
import { setConvo } from './convoSession';


const compose = require('composition');
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

export class Controller {
  constructor(name, children=[]) {
    this.name = name;
    this.children = children;
    this.children.forEach(c => c.parent = this);
    this.handlers = [];
  }
  addRegexHandler(regex, handler, bubble) {
    this.addHandler(async function(next) {
      const match = this.message && this.message.text && this.message.text.match(regex);
      if (match) {
        return await handler.bind(this)(match, next);
      } else {
        return next;
      };
    }, bubble);
  }
  addHandler(handler, bubble) {
    this.handlers.push({
      handler, bubble
    });
  }
  handle(ctx, bubble) {
    const controller = this;
    const lastHandler = async function (next) {
      const myRoute = this.router.routeFor(controller);
      if (myRoute.length) {
        await this.router.route(this, R.init(myRoute));
      }
    };
    return compose(R.map(R.prop('handler'))([
      ...this.handlers.filter(({handler, bubble: b}) => !bubble || (bubble && b)),
      {handler: lastHandler}])).call(ctx)
  }
}

export class Menu extends Controller {
  constructor(name, children) {
    super(name, children);
    const controller = this;
    this.addRegexHandler(/\/go_(.+)/, async function ([_, name], next) {
      const c = R.find(R.propEq('name', name))(controller.children);
      if (!c) {
        console.warn('TODO ERROR'); // or clear state and pass to parents
      } else {
        this.session.route = [...this.router.routeFor(controller), name];
        await this.reply(`${this.session.route.join('/')} route chosen`);
        return next;
      }
    }, true/* catch it in bubble from children */);
    this.addRegexHandler(/\/start/, async function(_, next) {
      this.session.route = this.router.routeFor(controller); // TODO setter in router
      await this.reply(R.map(R.prop('name'))(controller.children).map(n => `go_${n}`).join('\n'));
    }, true);
  }
}

export class MainMenu extends Menu {
  constructor(children) {
    super('', children);
  }
}

class HelloBot extends Controller {
  constructor() {
    super('peers');
    this.addRegexHandler(/\/hi/, async function (_, next) {
      await this.reply('hello');
      return next;
    });
    this.addHandler(async function (next) {
      await this.reply('derp also');
      return next;
    });
    //this.addHandler(async function (next) {
    //  await this.reply('this shouldnt be shown');
    //  return next;
    //});
  }
}

class AppleBot extends Controller {
  constructor() {
    super('apples');
    this.addHandler(async function (next) {
      await this.reply('apples!');
      return next;
    });
    //this.addHandler(async function (next) {
    //  await this.reply('this shouldnt be shown');
    //  return next;
    //});
  }
}

// const mainMenu = new MainMenu(
//   [new HelloBot(), new AppleBot()]
// );

