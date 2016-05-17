import { bot as telegram } from '../telegram.js';
import Promise from 'bluebird';

const state = {}; // {userId: routeName} // TODO to session?
export const routes = {};

// middleware that injects route name based on userId

const getRoute = fromId => {
  const routeName = state[fromId];
  return routes[routeName];
};

telegram.use(function * (next) {
  const fromId = this.message.from.id;
  this.state.route = getRoute(fromId);
  yield next;
});

telegram.hears(/^\/route (\w+)/, function * (next) {
  const fromId = this.message.from.id;
  this.state.done = true; // TODO no 'hears', just 'use' so more flexibility
  const rn = this.match[1];
  const route = routes[rn];
  if (!route) {
    this.reply(`no such route "${rn}"`)
  } else {
    state[fromId] = rn;
    if (route.subbot.welcome) {
      const welcomeMessage = route.subbot.welcome(); // TODO enhance
      this.reply(welcomeMessage);
    } else {
      this.reply(`subbot ${rn} chosen`);
    }
  }
});

class Route { // relay telegram methods
  constructor(name, subbot, global) {
    this.name = name;
    this.subbot = subbot;
    this.global = global;
    routes[name] = this;
  }
}

const shouldSkip = (currentHandler, route) => {
  return !currentHandler.global && (!route || route.name !== currentHandler.name);
};

['hears', 'on'].forEach(m => Route.prototype[m] = function(a1, ...middleware) {
  const currentHandler = this;
  return telegram[m](a1, ...middleware.map(mw => {
    return function * (next) {
      if (this.state.done) return;
      const { route } = this.state;
      if (shouldSkip(currentHandler, route)) return yield next;
      this.state.done = true;
      return yield mw;
    }
  }));
});

// no messaging for user if not current route. i.e. quiz timer.
['sendMessage'].forEach(m => Route.prototype[m] = function(chatId, message, props) {
  const currentHandler = this;
  const route = getRoute(chatId);
  return shouldSkip(currentHandler, route) ? Promise.resolve() : telegram[m](chatId, message, props);
});

export default Route;
