import eliza from './elizaParse.js';
// import server from './server.js';
import { webHookCallback as telegramWebHookCallback, isPolling } from './telegram.js';
import TelegramQuiz from './telegramQuiz.js';
const Promise = require('bluebird');
const http = require('http');

if (!isPolling) {
  const server = http.createServer(telegramWebHookCallback);
  server.listen(process.env.PORT || 3000);
  // server.use();
}

new TelegramQuiz();
