'use strict';

const ElizaBot = require('eliza/elizabot.js');

let elizas = {}; // explicitly let to say "I'm mutable"

export default {
  parse(from, message) {
    const eliza = elizas[from];
    if (!eliza) {
      const newEliza = new ElizaBot;
      const init = newEliza.getInitial();
      const firstMessage = newEliza.transform(message); // ignored
      elizas[from] = newEliza;
      return init;
    } else {
      return eliza.transform(message);
    }
  }
}
