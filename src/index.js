import eliza from './elizaParse.js';
import server from './server.js';
import telegram from './telegram.js';

telegram.onMessage(msg => {
  // photo can be: a file path, a stream or a Telegram file_id
  const fromId = msg.from.id;
  return eliza.parse(fromId, msg.text);
});

// just for testing Eliza without telegram involved
server.route({
  method: 'GET',
  path: '/message/{user}/{message}',
  handler: function (request, reply) {
    const { user, message } = request.params;
    reply(eliza.parse(user, message));
  }
});
