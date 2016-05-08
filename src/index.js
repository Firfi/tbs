import eliza from './elizaParse.js';
// import server from './server.js';
import telegram from './telegram.js';
import Quiz from './quiz.js';

//bot.onText(/^\/start/, function (msg) {
//  const fromId = msg.from.id;
//  // TODO msg.chat.id etc
//  // init quiz, return first question
//  // const quiz = Quiz.initQuiz();
//
//});

telegram.onMessage(msg => {
  // photo can be: a file path, a stream or a Telegram file_id
  const fromId = msg.from.id;
  return eliza.parse(fromId, msg.text);
});

// just for testing Eliza without telegram involved
// TODO if we have any server AND telegram api webhook they conflict.
//server.route({
//  method: 'GET',
//  path: '/message/{user}/{message}',
//  handler: function (request, reply) {
//    const { user, message } = request.params;
//    reply(eliza.parse(user, message));
//  }
//});
