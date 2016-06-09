import { webHookCallback as telegramWebHookCallback, isPolling } from './telegram.js';
import Router from './router/router.js';
const http = require('http');

new Router();

if (!isPolling) {
  const server = http.createServer(telegramWebHookCallback);
  server.listen(process.env.PORT || 3000);
}
