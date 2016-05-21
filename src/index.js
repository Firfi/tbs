import eliza from './elizaParse.js';
// import server from './server.js';
import { webHookCallback as telegramWebHookCallback, isPolling } from './telegram.js';
import TelegramQuiz from './subbots/telegramQuiz/index.js';
import PeerRating from './subbots/peerRating/index.js';
import RelayBot from './subbots/relay/index.js';
import MainMenu from './subbots/mainMenu.js';
const Promise = require('bluebird');
const http = require('http');

if (!isPolling) {
  const server = http.createServer(telegramWebHookCallback);
  server.listen(process.env.PORT || 3000);
  // server.use();
}

// new MainMenu(); // order depends. global first.
//new RelayBot();
//new TelegramQuiz();
//new PeerRating();
