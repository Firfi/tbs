import Speaker, { getSpeaker } from '../../../model/speaker';

const botSpeakerId = 'peerBot';

const initialSpeaker = new Speaker({name: 'Dave', id: botSpeakerId});
const speakerPromise = getSpeaker(botSpeakerId, initialSpeaker);

export default async function() {
  return await speakerPromise;
}
