import { join as joinMetaGroup } from '../../metaGroup.js';
import { bot as telegram } from '../../telegram.js';

export default
class Relay {
  constructor() {

    telegram.hears(/^\/join (\w+)/, function * () {
      this.state.done = true;
      const gid = this.match[1]; // new msg.chat.id actually
      const msg = this.message;
      const fromId = msg.from.id;
      joinMetaGroup(gid, fromId).then(metaGroup => {
        return metaGroup.sendMessage(`user ${fromId} joined`); // TODO user name
      });

    });

    //telegram.on('message', function * (next) {
    //  if (this.state.done) return;
    //  const msg = this.message;
    //  const fromId = msg.from.id;
    //
    //});

  }
}
