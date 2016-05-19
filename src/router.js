
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


let _route = [];
let _root; // meh

const getRoute = (fromId) => {
  return _route; // TODO
};

export const init = root => {
  _root = root;
  telegram.use(function * (next) { // fetch global route
    const fromId = (this.callbackQuery || this.message).from.id;
    this.state.route = getRoute(fromId);
    yield next;
  });
  telegram.use(function * (next) {
    this.state.bot = getBot(this.state.route, root);
    winston.debug('gotten bot:', this.state.bot.name);
    yield next;
  });
  telegram.hears(/^\/global route ([\w\/]+)/, function * () { // TODO clear keyboard state on start of route change
    const fromId = this.message.from.id;
    this.state.done = true; // TODO no 'hears', just 'use' so more flexibility
    _route = this.match[1].split('/');
    this.reply(`${this.match[1]} chosen`);
  });
  telegram.hears('/menu', function * () {
    this.state.bot.sendWelcome(this.message.chat.id);
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

// no messaging for user if not current route. i.e. quiz timer.
  ['sendMessage'].forEach(m => api[m] = function(chatId, message, props) {
    const target = getBot(getRoute(chatId), _root);
    return shouldSkip(me, target) ? Promise.resolve() : telegram[m](chatId, message, props);
  });

  return api;

};

export class Route {
  constructor(name) {
    this.name = name;
    this.telegram = mkTelegramFor(this);
    this.telegram.hears('/back', function * () {
      _route.pop();
      const nextBot = getBot(_route, _root);
      nextBot.sendWelcome(this.message.chat.id);
    });
  }
  sendWelcome(chatId) {
    const w = this.welcome && this.welcome();
    console.warn('w:', w);
    if (w) this.telegram.sendMessage(chatId, w).catch(winston.error.bind(winston));
  }
}

export class Menu extends Route {
  welcome() {
    return `${_route} Menu: \n${this.menuItems.map(item => `/go ${item.name}`)}`
  }
  constructor(name, items) {
    super(name);
    this.menuItems = items;
    this.telegram.hears(/\/go (\w+)/, function * () {
      const next = this.match[1];
      const nextRoute = _route.concat([next]);
      const nextBot = getBot(nextRoute, _root);
      if (nextBot) {
        _route = nextRoute;
        nextBot.sendWelcome(this.message.chat.id);
      }
    });

  }
}
