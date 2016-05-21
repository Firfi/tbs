
// import Route, { routes } from './subbots/router.js';
const winston = require('winston');
winston.level = 'debug';
import { bot as telegram, utils as telegramUtils } from './telegram.js';

//export default class MainMenu {
//  constructor() {
//    const telegram = new Route('root', this, true);
//    telegram.hears('/menu', function * () {
//      const routeCommands = Object.keys(routes).map(r => `/route ${r}`);
//      this.reply(`available routes: \n${routeCommands.join('\n')}`);
//    });
//  }
//}

export const ROOT = 'root';

const getBot = (route, root) => {
  // assumptions: bot is always instance of menu; menu always have items; items contains route part
  return route.reduce((bot, part) => bot.menuItems.find(item => item.name === part), root);
};


let _root; // meh





const mkTelegramFor = bot => {

  let api = {};

  const me = bot;

  const shouldSkip = (me, target) => {
    return me !== target;
    // return !currentHandler.global && (!route || route.name !== currentHandler.name);
  };

  for (let k in telegram) { // mock all telegraf api methods by default
    if (!telegram.hasOwnProperty(k) && typeof telegram[k] === 'function') {
      api[k] = telegram[k].bind(telegram);
    }
  }

// and override ones that we interested in

  ['hears', 'on'].forEach(m => api[m] = function(a1, ...middleware) {
    return telegram[m](a1, ...middleware.map(mw => {
      return function * (next) {
        if (this.state.done) return;
        const { bot: target } = this.state;
        if (shouldSkip(me, target)) return yield next;
        this.state.done = true;
        return yield mw;
      }
    }));
  });

// no messaging for user if not current route. i.e. quiz timer. TODO wont work with telegraf sessions
//  ['sendMessage'].forEach(m => api[m] = function(chatId, message, props) {
//    const target = getBot(this.session.route, _root);
//    return shouldSkip(me, target) ? Promise.resolve() : telegram[m](chatId, message, props);
//  });

  return api;

};

export class Route {
  constructor(name) {
    this.name = name;
    this.telegram = mkTelegramFor(this);
  }
  init(parent) {
    if (this.name === ROOT) {
      _root = this;
      telegram.use(function * (next) { // fetch global route
        // const fromId = (this.callbackQuery || this.message).from.id;
        this.session.route = this.session.route || [];
        yield next;
      });
      telegram.use(function * (next) {
        this.state.bot = getBot(this.session.route, _root);
        winston.debug('gotten bot:', this.state.bot.name);
        yield next;
      });
      telegram.hears(/\/start/, function * () { // sic! not this.telegram
        this.state.done = true;
        _root.sendWelcome(this);
      });
      telegram.hears(/\/menu/, function * () {
        this.state.done = true;
        this.state.bot.sendWelcome(this);
      });
      telegram.hears('/back', function * () {
        this.state.done = true;
        this.session.route.pop();
        const nextBot = getBot(this.session.route, _root);
        nextBot.sendWelcome(this);
      });

    }
  }
  sendWelcome(ctx) {
    const w = this.welcome && this.welcome(ctx) || ctx.session.route.join('/');
    return this.sendMessage(ctx, w);
  }
  sendMessage(ctx, message) {
    const chatId = telegramUtils.getChatId(ctx);
    return this.telegram.sendMessage(chatId, message).catch(winston.error.bind(winston));
  }
}

export class Menu extends Route {
  welcome(ctx) {
    return `${ctx.session.route.join('/')} Menu: \n${this.menuItems.map(item => `/go ${item.name}`)}`
  }
  constructor(name, items) {
    super(name);
    this.menuItems = items;
  }
  init(parent) {
    super.init(parent);
    this.telegram.hears(/\/go (\w+)/, function * () {
      const next = this.match[1];
      const nextRoute = this.session.route.concat([next]);
      const nextBot = getBot(nextRoute, _root);
      if (nextBot) {
        this.session.route = nextRoute;
        nextBot.sendWelcome(this).then(() => {
          winston.debug(`would send on enter message: ${!!nextBot.onEnter}`);
          if (nextBot.onEnter) {
            nextBot.onEnter(this);
          }
        });
      }
    });
    this.menuItems.forEach(item => item.init(this));
  }
}
