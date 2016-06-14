const mapKeys = require('lodash/mapKeys');
import wrap from '../../../utils/compose';
const last = require('lodash/last');
import globalCommands, { menuKb }  from '../../globalCommands';
import { attachCommandHandlers } from '../../../utils/commands';
import { setIntroImage, getIntroImage } from '../../store';
import { TelegramPhotoReplyMessage } from '../../../../chatModel/messages';

export default mapKeys({
  init: {
    async _onEnter(client) {
      await client.convo.reply('Select action (/set_intro_image for uploading intro img, /get_intro_image for check current one)'); // hideKeyboard(menuKb) we can't hide it and change at the same time
    },
    '*': wrap([globalCommands, attachCommandHandlers({
      async '/set_intro_image'(ctx) {
        const { machina, client, convo } = ctx;
        machina.transition(client, 'adminFlow.uploadIntroImage');
      },
      async '/get_intro_image'(ctx) {
        const { machina, client, convo } = ctx;
        const image = await getIntroImage();
        if (image) {
          convo.reply(new TelegramPhotoReplyMessage(image.telegramId))
        } else {
          await convo.reply('No intro image set');
        }
      }
    })])
  },

  uploadIntroImage: {
    async _onEnter(client) {
      await client.convo.reply('Upload intro image now');
      // TODO set timeout to move back
    },
    '*': wrap([globalCommands, async function(ctx, next) {
      const { client, convo, machina } = ctx;
      const { message } = convo;
      if (message.isPhoto()) {
        const { file_id } = last(message.content);
        await setIntroImage(file_id);
        await convo.reply('Intro image set.');
        machina.transition(client, 'welcome');
      } else {
        await convo.reply('It is not the image.');
      }
    }])
  }
}, (v, k) => `adminFlow.${k}`)
