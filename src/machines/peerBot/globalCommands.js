import { isCommand } from '../../utils/chat';
import { utils as telegramUtils } from '../../telegram.js';
const { oneTimeKeyboard, hideKeyboard } = telegramUtils;

const START = '/start'; const CREATE = '/create'; const RATE = '/rate';
export const commandList = [START, CREATE, RATE];

const menuKb = oneTimeKeyboard([[START], [CREATE], [RATE]]);

const helloMsg = 'Hello! Write /rate to get into rate mode and /create to get into create mode. Write /start to see this message again.';
export const helloArgs = [helloMsg, menuKb];

const commandHandlers = {
  async [START](client, convo) {
    if (this.compositeState(client) === 'welcome') {
      await convo.reply(...helloArgs);
    } else {
      this.transition(client, 'welcome');
      this.emit('handle.done', convo);
    }
  },
  async [CREATE](client, convo) {
    this.transition(client, 'createFlow.init');
    this.emit('handle.done', convo);
  }
};

export default (stateHandlersMap) => { // TODO in utils
  return Object.assign({}, stateHandlersMap, {
    async '*'(client, action_, convo) {
      if (convo.message.isText() && isCommand(convo.message.content)) {
        const commandHandler = commandHandlers[convo.message.content];
        if (commandHandler) {
          await commandHandler.bind(this)(client, convo);
        } else {
          console.warn('no such command handler', convo.message.content);
        }
      } else {
        if (stateHandlersMap['*']) {
          return await stateHandlersMap['*'].bind(this)(client, action_, convo);
        }
      }
    }
  })
};
