const token = process.env.TELEGRAM_TOKEN;
const Telegraf = require('telegraf');
import session from './telegrafSessionRedis.js';
import env from './env.js';
const merge = require('lodash/merge');

const botConfig = (env.isDevelopment()) ? {polling: true} : {
  polling: false,
  webHook: true
};

export const bot = new Telegraf(token);

bot.use(session({
  store: process.env.REDISCLOUD_URL ? { url: process.env.REDISCLOUD_URL } : {
    host: process.env.TELEGRAM_SESSION_HOST || '127.0.0.1',
    port: process.env.TELEGRAM_SESSION_PORT || 6379
  }
}));

const webHookPath = `/${token}`;
export const isPolling = !botConfig.webHook;

if (!isPolling) {
  bot.removeWebHook().then(() => {
    bot.setWebHook(`https://testbotserver.herokuapp.com${webHookPath}`);
  });
} else {
  bot.removeWebHook().then(() => {
    bot.startPolling();
  });
}

export const webHookCallback = bot.webHookCallback(webHookPath);

export const utils = {
  getEvent(ctx) {
    return ctx.message || ctx.callbackQuery || ctx.inlineQuery || ctx.chosenInlineResult
  },
  getFromId(ctx) {
    return this.getEvent(ctx).from.id;
  },
  getChatId(ctx) {
    const chat = this.getEvent(ctx).chat || this.getEvent(ctx).message.chat;
    return chat.id;
  },
  oneTimeKeyboard(kb) {
    return {reply_markup: {
      keyboard: kb,
      one_time_keyboard: true
    }};
  },
  hideKeyboard(kb) {
    return merge(kb || {}, {
      reply_markup: {
        hide_keyboard: true
      }
    })
  }
};

// Matches /echo [whatever]
//bot.onText(/\/echo (.+)/, function (msg, match) {
//  var fromId = msg.from.id;
//  var resp = match[1];
//  bot.sendMessage(fromId, resp);
//});
