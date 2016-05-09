import eliza from './elizaParse.js';
// import server from './server.js';
import telegram from './telegram.js';
import Quiz from './quiz.js';
const Promise = require('bluebird');
const chunk = require('lodash/chunk');

// telegram-quiz related mappings
let telegramQuizState = {
  // {chat id: {telegram message id: 'question id', running: boolean, currentQuestion}}
};

// method for formatting reply keyboard to square-like structure
const makeSquare = a => chunk(a, Math.ceil(Math.sqrt(a.length)));

// message is group message
const isGroup = msg => msg.from.id !== msg.chat.id;

const sendQuestion = (chatId, q) => {
  const { answers } = q.question;
  const { id: qid } = q;
  return telegram.sendMessage(chatId, `${q.question.text}: \n
  ${answers.map((a, i) => `/${i}: ${a.text}`).join('\n')}`, {
    reply_markup: {
      keyboard: makeSquare(answers.map((a, i) => `/${i}`)),
      force_reply: true
      //hide_keyboard: true,
      //one_time_keyboard: true // todo
      // selective: true // Targets: 1) users that are @mentioned in the text of the Message object; 2) if the bot's message is a reply (has reply_to_message_id) not actualy if several users
    }
  })
    .then(sentMessage => {
    const mid = sentMessage.message_id;
    telegramQuizState[chatId].idMapping[mid] = q.id;
    return sentMessage;
  });
};

const sendQuestionStat = (chatId, givenAnswer, correctAnswer) => {
  return telegram.sendMessage(chatId, correctAnswer !== givenAnswer ?
    `Given answer: ${givenAnswer.text}; correct answer: ${correctAnswer.text}` :
    `Correct!`);
};

const sendSuccess = (chatId, quiz) => {
  const answerLog = quiz.answers;
  const correct = answerLog.filter(({qid, aid}) => quiz.quiz.questions[qid].answers[aid].isCorrect).length;
  return telegram.sendMessage(chatId, `End. Correct answers: ${correct}/${answerLog.length}`);
};

telegram.onText(/^\/start/, msg => { // TODO CHECK IF RUNNING
  const chatId = msg.chat.id;
  const fromId = msg.from.id;
  const quiz = Quiz.initQuiz(chatId, fromId);
  const initialQuestion = quiz.currentQuestion();
  telegramQuizState[chatId] = {running: true, currentQuestion: initialQuestion, idMapping: {}};
  sendQuestion(chatId, initialQuestion);
  // init quiz, return first question
});

telegram.onText(/\/(\d+)/, (msg, match) => {
  const chatId = msg.chat.id;

  const quiz = Quiz.getQuiz(chatId);
  if (!quiz) return console.warn('got answer but no quiz initialised.'); // TODO error for user?

  let questionId = undefined;

  if (isGroup(msg)) { // additional checks for reply_to_message
    const replyTo = msg.reply_to_message;
    if (!replyTo) return console.warn('got answer without reply to'); // TODO error for user?
    const replyToId = replyTo.message_id; // always here
    const quizState = telegramQuizState[chatId];
    if (!quizState) return console.error(`no quiz state for chat ${chatId}`, telegramQuizState);
    questionId = quizState.idMapping[replyToId];
    if (questionId === undefined) return console.warn(`no saved real question id for answer ${replyToId}`); // TODO error for user?
  } else {
    questionId = quiz.currentQuestion().id
  }

  const fromId = msg.from.id;
  const answerId = Number(match[1]);

  quiz.giveAnswer(fromId/*TODO if user who is not in quiz answered*/, questionId, answerId)
    .then(({ nextQuestion, givenAnswer, correctAnswer }) => {
      return sendQuestionStat(chatId, givenAnswer, correctAnswer).then(() => nextQuestion ?
        sendQuestion(chatId, nextQuestion) : sendSuccess(chatId, quiz));
    })

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
