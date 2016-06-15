import { getIntroImage } from '../../store';

const mapKeys = require('lodash/mapKeys');
import wrap from '../../../utils/compose';
import globalCommands, { menuKb }  from '../../globalCommands';
import messages from './views/messages';
import { TelegramPhotoReplyMessage } from '../../../../chatModel/messages';
import { utils as telegramUtils } from '../../../../telegram'
const { oneTimeKeyboard } = telegramUtils;

export default mapKeys({
  init: {
    async _onEnter(client) {
      const image = await getIntroImage();
      await client.convo.reply(messages().welcome);
      if (image) {
        await client.convo.reply(new TelegramPhotoReplyMessage(image.telegramId))
      }
      this.transition(client, 'onboardingFlow.waitForName');
    },
    '*': wrap(async function (ctx) {
      ctx.machina.transition(ctx.client, 'onboardingFlow.waitForName');
    })
  },

  waitForName: {
    async _onEnter(client) {
      try {
        await client.convo.reply(messages().waitForName);
        console.warn('wait for name on enter');
      } catch (e) {
        console.error(e);
      }
    },
    '*': wrap([globalCommands, async function(ctx) {
      console.warn('wait for name any');
      const { convo, machina, client } = ctx;
      if (convo.message.isText()) { // TODO additional validation
        convo.message.user.profile = Object.assign(convo.message.user.profile || {}, {
          name: convo.message.content
        });
        await convo.message.user.save();
        machina.transition(client, 'onboardingFlow.waitForLocation');
      } else {
        convo.reply(messages().pleaseProvideName);
      }
    }])
  },

  waitForLocation: {
    async _onEnter(client) {
      try {
        await client.convo.reply(messages().waitForLocation, oneTimeKeyboard([[{
          text: messages().giveLocation, request_location: true
        }]]));
      } catch (e) {
        console.error(e);
      }
    },
    '*': wrap([globalCommands, async function(ctx, next) {
      const { client, convo, machina } = ctx;
      if (convo.message.isLocation()) {
        convo.message.user.profile = Object.assign(convo.message.user.profile || {}, {
          location: convo.message.content
        });
        await convo.message.user.save();
        machina.transition(client, 'welcome');
      } else {
        await convo.reply(messages().pleaseProvideLocation);
      }
    }])
  }
}, (v, k) => `onboardingFlow.${k}`)
