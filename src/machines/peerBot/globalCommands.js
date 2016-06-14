import { utils as telegramUtils } from '../../telegram.js';
const { oneTimeKeyboard, hideKeyboard } = telegramUtils;
import t from '../views/messages';

import { attachCommandHandlers } from '../utils/commands';

export const START = '/start'; export const CREATE = '/create'; export const RATE = '/rate';
export const ADMIN = '/rosebud'; export const ONBOARDING = '/onboarding';
export const commandList = [START, CREATE, RATE];

export const menuKb = oneTimeKeyboard([[START], [CREATE], [RATE]]);

export const helloArgs = () => [t('hello'), menuKb];


export default attachCommandHandlers({
  async [START](ctx) {
    const { machina, client, convo } = ctx;
    if (machina.compositeState(client) === 'welcome') {
      await convo.reply(...helloArgs());
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
  async [ONBOARDING](ctx) {
    const { machina, client, convo } = ctx;
    machina.transition(client, 'onboardingFlow.init');
  },
  async '/test'(ctx) {
    const { machina, client, convo } = ctx;
    machina.transition(client, 'testFlow.init');
  },
  async [ADMIN](ctx) {
    const { machina, client, convo } = ctx;
    machina.transition(client, 'adminFlow.init');
  }
});
