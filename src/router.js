
// import Route, { routes } from './subbots/router.js';
const winston = require('winston');
winston.level = 'debug';
import { bot as telegram, utils as telegramUtils } from './telegram.js';
const { oneTimeKeyboard } = telegramUtils;

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

export const BACK_COMMAND = '/back';
export const MENU_COMMAND = '/menu';
export const START_COMMAND = '/start';
export const HELP_COMMAND = '/help';

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
      telegram.hears(START_COMMAND, function * () { // sic! not this.telegram
        this.state.done = true; // TODO
        _root.sendWelcome(this);
      });
      telegram.hears(MENU_COMMAND, function * () {
        this.state.done = true;
        this.session.route = [];
        _root.sendWelcome(this);
      });
      telegram.hears(BACK_COMMAND, function * () {
        this.state.done = true;
        this.session.route.pop();
        const nextBot = getBot(this.session.route, _root);
        nextBot.sendWelcome(this);
      });
      telegram.hears(HELP_COMMAND, function * () {
        this.state.done = true;
        const helpMessage = (this.state.bot.help && this.state.bot.help()) || 'Generic help here';
        this.state.bot.sendMessage(this, helpMessage);
      });
    }
  }
  sendWelcome(ctx) {
    const w = this.welcome && this.welcome(ctx) || ctx.session.route.join('/');
    const args = typeof w === 'string' ? {
      message: w
    } : w;
    return this.sendMessage(ctx, args.message, args.layout);
  }
  sendMessage(ctx, message, layout) {
    const chatId = telegramUtils.getChatId(ctx);
    return this.telegram.sendMessage(chatId, message, layout).catch(winston.error.bind(winston));
  }
}

export class Menu extends Route {
  welcome(ctx) {
    const items = this.menuItems.map(item => [`/go_${item.name}`]);
    return {
      layout: oneTimeKeyboard(items),
      message: `${ctx.session.route.join('/')} Menu: \n${items.join('\n')}`
    }
  }
  constructor(name, items) {
    super(name);
    this.menuItems = items;
  }
  init(parent) {
    super.init(parent);
    this.telegram.hears(/\/go_(\w+)/, function * () {
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
