// todo

async function setOnboardingSlots(client, slots) {
  client.onboardingSlots = slots;
  await setConvo(client.sessionKey, client);
}

async function clearOnboardingSlots(client) {
  delete client.onboardingSlots;
  await setConvo(client.sessionKey, client);
}

async function sendNextSlot(client, convo) {
  const currentSlot = client.onboardingSlots.find(s => !s.answer);
  const isLast = currentSlot === last(client.onboardingSlots);
  const { question } = currentSlot;
  await convo.reply(question);
}

async function fillNextSlot(client, answer) {
  const currentSlot = client.onboardingSlots.find(s => !s.answer);
  const isLast = currentSlot === last(client.onboardingSlots);
  currentSlot.answer = answer;
  await setConvo(client.sessionKey, client);
  return isLast;
}


const onBoarding = {
  onboarding: {
    async _reset(...args) {
    },
    async _onEnter(client) {
      await setOnboardingSlots(client, [
        {question: 'Please enter your name'}, // TODO strings in db
        {question: 'Hello what is your name'}
      ]);
      await sendNextSlot(client, client.convo);
    },
    async '*'(client, action_, convo) {
      if (convo.message.isText()) {
        const isLast = await fillNextSlot(convo.message.content);
        if (!isLast) {
          await sendNextSlot(client, client.convo);
          this.emit('handle.done', convo);
        } else {
          await convo.reply('Done!');
          this.transition(client, 'welcome');
        }
      } else {
        console.warn('expect text message here')
      }
      console.warn('any', action_);
    },
    async _onExit(client) {
      await clearOnboardingSlots(client);
    }
  },
}
