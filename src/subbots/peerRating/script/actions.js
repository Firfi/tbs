import { defaultSpeaker } from './speakers.js';

class RespondingCommand {
  constructor(name) {

  }
  withResponder(responder) {
    this.responder = responder;
    return this;
  }
  withRunner(runner) {
    this.runner = runner;
  }
  withNext(next) {
    this.goNext = (payload) => this.runner.go(next, payload);
    return this;
  }
}

export class Say extends RespondingCommand { // TODO share for other bots
  constructor({ name, what, waitFor=false, delay=1000, speaker=defaultSpeaker }) {
    super(name);
    this.what = what;
    this.waitFor = waitFor;
    this.delay = delay;
    this.speaker = speaker;
  }
  run(ctx, payload) {
    this.responder.say(ctx, this.what);
    setTimeout(this.goNext, this.delay);
  }

}

export class Input extends RespondingCommand {
  constructor({ name }) {
    super(name);
  }
  run(ctx, payload) {
    this.responder.listen(this.name, ctx, ({ message, done }) => {
      this.goNext(message);
      done();
    });
  }
}
