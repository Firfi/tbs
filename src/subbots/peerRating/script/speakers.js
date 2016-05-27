export class Speaker {
  constructor({ name }) {
    this.name = name;
  }
}

export const defaultSpeaker = new Speaker({ name: 'bot' });
