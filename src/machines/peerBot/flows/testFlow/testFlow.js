const mapKeys = require('lodash/mapKeys');
const mapValues = require('lodash/mapValues');
const winston = require('winston');
import { utils as telegramUtils } from '../../../../telegram';
const { hideKeyboard } = telegramUtils;

import wrap from '../../../utils/compose';
import globalCommands from '../../globalCommands'


export default mapKeys({
  init: {
    async _onEnter(client) {
      this.transition(client, 'testFlow.intro');
    }
  },

  intro: {
    '*': wrap([globalCommands, async function (ctx, next) {
      const { client, convo, machina } = ctx;
      if (convo.message.content === 'derp') {
        await convo.reply('derp!');
      } else if (convo.message.content === 'crash') {
        throw new Error('azaza');
      } else {
        next();
      }
    }])
  }
}, (v, k) => `testFlow.${k}`)
