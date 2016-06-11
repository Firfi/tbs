import { utils as telegramUtils } from '../../../telegram.js';
const { oneTimeKeyboard } = telegramUtils;

import postRateCommands from '../postRateCommands';

import t from '../../views/messages';



export default {
  rateFlow: {
    postRateMenu: {
      keyboard: oneTimeKeyboard(Object.values(postRateCommands).map(c => [c])),
      message: t('peer.rateFlow.postRateMenu.keyboard')
    }
  }
};
