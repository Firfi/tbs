import { Menu, ROOT } from '../router.js';
import TestBot from './testBot.js';
import TelegramQuiz from './telegramQuiz/index.js';
import Relay from './relay/index.js';
import PeerRating from './peerRating/index.js';

export default new Menu(ROOT, [
  //new Menu('submenu1', [
  //  new TestBot('subbot2')
  //]),
  new Relay('relay'),
  new TelegramQuiz('quiz'),
  new PeerRating('peers')
]).init()
