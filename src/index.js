import eliza from './elizaParse.js';
// import server from './server.js';
import { webHookCallback as telegramWebHookCallback, isPolling } from './telegram.js';
import Router from './router2.js';
const Promise = require('bluebird');
const http = require('http');

new Router();

if (!isPolling) {
  const server = http.createServer(telegramWebHookCallback);
  server.listen(process.env.PORT || 3000);
  // server.use();
}

// new MainMenu(); // order depends. global first.
//new RelayBot();
//new TelegramQuiz();
//new PeerRating();
