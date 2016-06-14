import { utils as telegramUtils } from '../../telegram.js';
const { oneTimeKeyboard, hideKeyboard } = telegramUtils;

import { attachCommandHandlers } from '../utils/commands';

export const START = '/start'; export const CREATE = '/create'; export const RATE = '/rate';
export const commandList = [START, CREATE, RATE];

export const menuKb = oneTimeKeyboard([[START], [CREATE], [RATE]]);

const helloMsg = 'Hello! Write /rate to get into rate mode and /create to get into create mode. Write /start to see this message again.';
export const helloArgs = [helloMsg, menuKb];


export default attachCommandHandlers({
  async [START](ctx) {
    const { machina, client, convo } = ctx;
    if (machina.compositeState(client) === 'welcome') {
      await convo.reply(...helloArgs);
    } else {
      machina.transition(client, 'welcome');
    }
  },
  async [CREATE](ctx) {
    const { machina, client, convo } = ctx;
    machina.transition(client, 'createFlow.init');
  },
  async [RATE](ctx) {
    const { machina, client, convo } = ctx;
    machina.transition(client, 'rateFlow.init');
  },
  async '/test'(ctx) {
    const { machina, client, convo } = ctx;
    machina.transition(client, 'testFlow.init');
  }
});
