import { utils as telegramUtils } from '../../../../../telegram.js';
import t from '../../../../views/messages';
const { oneTimeKeyboard } = telegramUtils;
import messages from './messages';

import postRateCommands from '../postRateCommands';
import { humanizeCommandString } from '../../../../utils/commands';

export default () => ({
  postRateMenu: {
    keyboard: oneTimeKeyboard(Object.values(postRateCommands).map(c => [humanizeCommandString(c)])),
    message: messages().postRateMenu
  }
})
