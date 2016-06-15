import machina from 'machina';
import { TextReplyMessage } from '../../chatModel/messages';
import globalCommands, { helloArgs } from './globalCommands';
import { unlock as unlockConvo, setConvo } from '../../router/convoSession';
import createFlow from './flows/createFlow/createFlow';
import rateFlow from './flows/rateFlow/rateFlow';
import onboardingFlow from './flows/onboardingFlow/onboardingFlow';
import testFlow from './flows/testFlow/testFlow';
import adminFlow from './flows/adminFlow/adminFlow';
import speaker from './views/speaker';
import { addSpeaker } from '../../sender/speakerRegistry';

import wrap from '../utils/compose';

const NAMESPACE = 'peer';

speaker().then(s => {
  addSpeaker(NAMESPACE, s); // we know it's root here. TODO better way
});

const shouldRedirectToOnboarding = (user) => {
  return !(user.profile && user.profile.name && user.profile.location);
};

export default new machina.BehavioralFsm({
  initialize(...args) {
  },

  namespace: NAMESPACE,

  initialState: 'welcome',

  states: Object.assign({

    welcome: {
      async _onEnter(client) {
        // TODO if user is not known

        if (shouldRedirectToOnboarding(client.convo.message.user)) {
          this.transition(client, 'onboardingFlow.init');
        } else {
          await client.convo.reply(...helloArgs());
        }

      },
      '*': wrap(globalCommands, async (ctx) => {
        const { client, machina } = ctx;
        if (shouldRedirectToOnboarding(client.convo.message.user)) {
          machina.transition(client, 'onboardingFlow.init');
        } else {
          await client.convo.reply(...helloArgs());
        }
      })
      // async '*'(client, action_, convo) {
      //   if (convo.locked()) return console.warn('locked yet!');
      //   await convo.lock();
      //   await new Promise((success) => {
      //     setTimeout(success, 2000)
      //   });
      //   await convo.reply(new TextReplyMessage('hello world'));
      //   await convo.unlock();
      //   this.transition(client, 'derp');
      //   this.emit('handle.done', convo);
      // }
    }
  }, createFlow, rateFlow, onboardingFlow, testFlow, adminFlow)

});
