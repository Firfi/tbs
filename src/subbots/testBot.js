import { Route } from '../router.js';

export default class TestBot extends Route {
  constructor(name) {
    super(name);
    const { telegram } = this;
    telegram.hears('/test', function * (next) {
      telegram.sendMessage(this.message.from.id, this.message.text);
    });
  }
}
