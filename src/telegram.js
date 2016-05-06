const token = process.env.TELEGRAM_TOKEN;
const TelegramBot = require('node-telegram-bot-api');
import env from './env.js';

// TODO URL from env vars

const botConfig = (env.isDevelopment() || true) ? {polling: true} : { // turn it on for everything until HTTPS issue resolved
  polling: false,
  webHook: { // TODO NO webhook, NO polling as webhook conflicts with any type of server as it does http.listen itself
    port: process.env.PORT,
    host: '0.0.0.0' // sign cert to have https
  }
};

const bot = new TelegramBot(token, botConfig);

// bot.setWebHook('https://testbotserver.herokuapp.com'); // TODO HTTPS is necessary

export default {
  onMessage(cb) { // TODO steam, no cb
    bot.on('message', msg => {
      const chatId = msg.chat.id;
      const resp = cb(msg); // TODO promises?
      bot.sendMessage(chatId, resp);
    });
  }
}

// Matches /echo [whatever]
//bot.onText(/\/echo (.+)/, function (msg, match) {
//  var fromId = msg.from.id;
//  var resp = match[1];
//  bot.sendMessage(fromId, resp);
//});
