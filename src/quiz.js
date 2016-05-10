const R = require('ramda');
const Promise = require('bluebird');

let quizzes = [];

class Answer {
  constructor(text) {
    this.text = text;
  }
}

class CorrectAnswer extends Answer {
  constructor(text) {
    super(text);
    this.isCorrect = true;
  }
}

class IncorrectAnswer extends Answer {
  constructor(text) {
    super(text);
    this.isCorrect = false;
  }
}

class NoAnswer extends IncorrectAnswer {
  constructor() {
    super();
    this.isNoAnswer = true;
  }
}

export const noAnswer = new NoAnswer();

const CA = text => new CorrectAnswer(text);
const IA = text => new IncorrectAnswer(text);

const sampleQuiz = {
  questions: [
    {
      text: 'Who is the Face of Boe?',
      answers: [IA('Micky Smith'), CA('Jack Harkness'), IA('Davros')]
    },
    {
      text: 'Who created the Daleks?',
      answers: [CA('Davros'), IA('Harriet Jones'), IA('Allonzo')]
    },
    {
      text: 'Who did David Tennant regenerate into?',
      answers: [CA('Matt Smith'), IA('Colin baker'), IA('Jon Pertwee')]
    }
  ].map(q => ({...q, time: 5000}))
}; // TODO in db

class Quiz {
  constructor(cid, uid) {
    this.cid = cid;
    this.uids = [uid]; // as we'll have more participants
    this.quiz = sampleQuiz;
    this.answers = []; // only one answers succession for all users.
  }
  step() {
    return this.answers.length;
  }
  currentQuestion() {
    const step = this.step();
    const question = this.quiz.questions[step];
    if (!question) console.error("we shouldn't ask questions where there's nothing left. Handle quiz wrap-up elsewhere.");
    return {
      question,
      id: step,
      left: this.answers.length - step
    }
  }
  giveAnswer(uid, qid, aid) { // qid/aid could be indexes now
    const current = this.step();
    const currentQuestion = this.currentQuestion();
    return current !== qid ? Promise.reject({message: `got answer on wrong question. Question answered: ${qid},
    current question: ${current}`}) : new Promise((success, fail) => {
      const givenAnswer = aid !== undefined ? currentQuestion.question.answers[aid] : noAnswer;
      if (!givenAnswer) {
        return fail({message: `got answer for correct question, but answer id is wrong. Question: ${qid}, answer: ${aid}`});
      } else {
        this.answers.push({
          uid, qid, aid
        });
        const next = this.quiz.questions[this.step()];
        return success({
          nextQuestion: next ? this.currentQuestion() : null,
          givenAnswer, // answer or false
          correctAnswer: R.find(R.propEq('isCorrect', true))(currentQuestion.question.answers)
        });
      }

    });
  }
}

export default {
  initQuiz(cid, uid) {
    const quiz = new Quiz(cid, uid);
    quizzes[cid] = quiz;
    return quiz;
  },
  getQuiz(cid) {
    return quizzes[cid];
  }
};
