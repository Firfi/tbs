
// import Route, { routes } from './subbots/router.js';
const winston = require('winston');
winston.level = 'debug';
import { bot as telegram } from './telegram.js';

//export default class MainMenu {
//  constructor() {
//    const telegram = new Route('root', this, true);
//    telegram.hears('/menu', function * () {
//      const routeCommands = Object.keys(routes).map(r => `/route ${r}`);
//      this.reply(`available routes: \n${routeCommands.join('\n')}`);
//    });
//  }
//}


const getBot = (route, root) => {
  // assumptions: bot is always instance of menu; menu always have items; items contains route part
  return route.reduce((bot, part) => bot.menuItems.find(item => item.name === part), root);
};


let _root; // meh

export const init = root => {
  _root = root; // TODO take .use stuff OUT as it applies on telegram before listeners from bots applied
  telegram.use(function * (next) { // fetch global route
                                   // const fromId = (this.callbackQuery || this.message).from.id;
    this.session.route = this.session.route || [];
    yield next;
  });
  telegram.use(function * (next) {
    this.state.bot = getBot(this.session.route, root);
    winston.debug('gotten bot:', this.state.bot.name);
    yield next;
  });
  telegram.hears(/^\/global route ([\w\/]+)/, function * () { // TODO clear keyboard state on start of route change
    const fromId = this.message.from.id;
    this.state.done = true; // TODO no 'hears', just 'use' so more flexibility
    this.session.route = this.match[1].split('/');
    this.reply(`${this.match[1]} chosen`);
  });
};



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
    this.telegram.hears(/\/menu/, function * () {
      this.state.bot.sendWelcome(this);
    });
    this.telegram.hears('/back', function * () {
      this.session.route.pop();
      const nextBot = getBot(this.session.route, _root);
      nextBot.sendWelcome(this);
    });
  }
  sendWelcome(ctx) {
    const chatId = ctx.message.chat.id;
    const w = this.welcome && this.welcome(ctx);
    this.telegram.sendMessage(chatId, w || ctx.session.route.join('/')).catch(winston.error.bind(winston));
  }
}

export class Menu extends Route {
  welcome(ctx) {
    return `${ctx.session.route.join('/')} Menu: \n${this.menuItems.map(item => `/go ${item.name}`)}`
  }
  constructor(name, items) {
    super(name);
    this.menuItems = items;
    this.telegram.hears(/\/go (\w+)/, function * () {
      const next = this.match[1];
      const nextRoute = this.session.route.concat([next]);
      const nextBot = getBot(nextRoute, _root);
      if (nextBot) {
        this.session.route = nextRoute;
        nextBot.sendWelcome(this);
      }
    });

  }
}
