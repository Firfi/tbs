import { utils as telegramUtils } from '../../telegram.js';
const { oneTimeKeyboard, hideKeyboard } = telegramUtils;

import { attachCommandHandlers } from '../utils/commands';

export const START = '/start'; export const CREATE = '/create'; export const RATE = '/rate';
export const commandList = [START, CREATE, RATE];

export const menuKb = oneTimeKeyboard([[START], [CREATE], [RATE]]);

const helloMsg = 'Hello! Write /rate to get into rate mode and /create to get into create mode. Write /start to see this message again.';
export const helloArgs = [helloMsg, menuKb];

const commandHandlers = {
  async [START](client, convo) {
    if (this.compositeState(client) === 'welcome') {
      await convo.reply(...helloArgs);
    } else {
      this.transition(client, 'welcome');
    }
  },
  async [CREATE](client, convo) {
    this.transition(client, 'createFlow.init');
  },
  async [RATE](client, convo) {
    this.transition(client, 'rateFlow.init');
  }
};

export default attachCommandHandlers(commandHandlers);
