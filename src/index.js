import { webHookCallback as telegramWebHookCallback, isPolling } from './telegram.js';
import { init as initMessages } from './machines/views/messages';
import Router from './router/router.js';
const http = require('http');

const initApp = async () => {
  console.warn('init app');
  await initMessages();
  new Router();
};

initApp();

if (!isPolling) {
  const server = http.createServer(telegramWebHookCallback);
  server.listen(process.env.PORT || 3000);
}
