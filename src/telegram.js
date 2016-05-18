const token = process.env.TELEGRAM_TOKEN;
const Telegraf = require('telegraf');
import env from './env.js';

const botConfig = (env.isDevelopment()) ? {polling: true} : {
  polling: false,
  webHook: true
};

export const bot = new Telegraf(token);

bot.use(Telegraf.memorySession());

const webHookPath = `/${token}`;
export const isPolling = true || !botConfig.webHook;

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

// Matches /echo [whatever]
//bot.onText(/\/echo (.+)/, function (msg, match) {
//  var fromId = msg.from.id;
//  var resp = match[1];
//  bot.sendMessage(fromId, resp);
//});
