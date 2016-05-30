// import Route, { routes } from './subbots/router.js';
const winston = require('winston');
winston.level = 'debug';
import { bot as telegram, utils as telegramUtils } from './telegram.js';
const { oneTimeKeyboard } = telegramUtils;
import Promise from 'bluebird';
// import compose from 'koa-compose';
import R from 'ramda';

const compose = require('composition');

//function compose(middleware){
//  console.warn('middleware')
//  return function *(next){
//    console.warn('function ababa')
//    if (!next) next = noop();
//
//    var i = middleware.length;
//
//    while (i--) {
//      next = middleware[i].call(this, next);
//    }
//
//    return yield *next;
//  }
//}
//
//function *noop(){}

export default class Router {
  constructor() {
    const router = this;
    telegram.use(function * (next) { // fetch global route
      // const fromId = (this.callbackQuery || this.message).from.id;
      this.session.route = this.session.route || [];
      this.router = router;
      yield router.route(this);
      yield next;
    });
  }
  async route(ctx) {
    return await this.getBot(ctx.session.route).handle(ctx);
  }
  getBot(route) {
    return route.reduce((bot, part) => bot.children.find(item => item.name === part), mainMenu);
  }
}

export class Bot {
  constructor(name) {
    this.name = name;
    this.handlers = [];
  }
  addRegexHandler(regex, handler) {
    this.handlers.push(async function(next) {
      const match = this.message && this.message.text && this.message.text.match(regex);
      if (match) {
        return await handler.bind(this)(match, next);
      } else {
        return next;
      };
    });
  }
  addHandler(handler) {
    this.handlers.push(handler);
  }
  handle(ctx) {
    const lastHandler = async function () {
      console.warn('got last handler... pass above!');
    }
    return compose([...this.handlers, lastHandler]).call(ctx)
  }
}

export class Menu extends Bot {
  constructor(name, children) {
    super(name);
    this.children = children;
    this.addRegexHandler(/\/go_(.+)/, async function ([_, name], next) {
      const c = R.find(R.propEq('name', name))(this.children);
      if (!c) {
        console.warn('TODO ERROR'); // or clear state and pass to parents
      } else {
        this.session.route.push(name);
        return next;
      }
    });
  }
}

export class MainMenu extends Menu {
  constructor(children) {
    super('', children);
  }
}

class HelloBot extends Bot {
  constructor() {
    super('peers');
    this.addRegexHandler(/\/hi/, async function (_, next) {
      await this.reply('hello');
      return next;
    });
    this.addHandler(async function (next) {
      return await this.reply('derp also');
      // return next;
    });
    this.addHandler(async function (next) {
      return await this.reply('this shouldnt be shown');
      // return next;
    });
  }
}

const mainMenu = new MainMenu(
  [new HelloBot()]
);

