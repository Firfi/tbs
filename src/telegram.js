const token = process.env.TELEGRAM_TOKEN;
const TelegramBot = require('node-telegram-bot-api');
import env from './env.js';

// TODO URL from env vars

console.warn('env.isDevelopment()', env.isDevelopment(), 'token', token);

const botConfig = (env.isDevelopment()) ? {polling: true} : { // turn it on for everything until HTTPS is
  polling: false,
  webHook: { // TODO NO webhook, NO polling as webhook conflicts with any type of server as it does http.listen itself
    port: process.env.PORT,
    host: '0.0.0.0' // sign cert to have https
  }
};

const bot = new TelegramBot(token, botConfig);
if (botConfig.webHook) {
  bot.setWebHook('').then(() => {
    bot.setWebHook(`https://testbotserver.herokuapp.com/${token}`);
  });
}

export default bot;

// Matches /echo [whatever]
//bot.onText(/\/echo (.+)/, function (msg, match) {
//  var fromId = msg.from.id;
//  var resp = match[1];
//  bot.sendMessage(fromId, resp);
//});
