const token = process.env.TELEGRAM_TOKEN;
const Telegraf = require('telegraf');
import env from './env.js';

const botConfig = (env.isDevelopment()) ? {polling: true} : {
  polling: false,
  webHook: true
};

export const bot = new Telegraf(token);
const webHookPath = `testbotserver.herokuapp.com/${token}`;
export const isPolling = true || !botConfig.webHook;

if (!isPolling) {
  bot.setWebHook('').then(() => {
    bot.setWebHook(`https://${webHookPath}`);
  });
} else {
  bot.startPolling();
}

export const webHookCallback = bot.webHookCallback(`/${webHookPath}`);

// Matches /echo [whatever]
//bot.onText(/\/echo (.+)/, function (msg, match) {
//  var fromId = msg.from.id;
//  var resp = match[1];
//  bot.sendMessage(fromId, resp);
//});
