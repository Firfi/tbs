import { defaultSpeaker } from './speakers.js';

export class Say { // TODO share for other bots
  constructor({ what, waitFor=false, delay=1000, speaker=defaultSpeaker }) {
    this.what = what;
    this.waitFor = waitFor;
    this.delay = delay;
    this.speaker = speaker;
  }
  run(telegram) {

  }
}
