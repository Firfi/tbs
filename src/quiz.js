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
  ]
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
      left: this.answers.length - step
    }
  }
  giveAnswer(uid, qid, aid) { // qid/aid could be indexes now
    this.answers.push({
      uid, qid, aid
    });
    const next = this.quiz.questions[this.step()];
    return {
      nextQuestion: next ? this.currentQuestion() : null
    };
  }
}

export default {
  initQuiz(cid, uid) {
    return new Quiz(cid, uid);
  }
};
