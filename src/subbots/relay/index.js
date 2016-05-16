import { join as joinMetaGroup, groupsFor, get as getGroup } from '../../metagroup.js';
import { bot as telegram } from '../../telegram.js';

export default
class Relay {
  constructor() {

    telegram.hears(/^\/join (\w+)/, function * () { // TODO generic functionality for all metaGroup bots. leave/join/etc
      this.state.done = true;
      const gid = this.match[1]; // new msg.chat.id actually
      const msg = this.message;
      const fromId = msg.from.id;
      joinMetaGroup(gid, fromId).then(({ group, ok }) => {
        if (ok) return group.sendMessage(`user ${fromId} joined`); // TODO user name
      });
    });

    telegram.hears(/^\/leave (\w+)/, function * () {
      this.state.done = true;
      const gid = this.match[1];
      const msg = this.message;
      const fromId = msg.from.id;
      getGroup(gid).then(group => {
        if (group) {
          return group.leave(fromId).then(ok => {
            if (ok) {
              group.sendMessage(`user ${fromId} left`);
            }
          });
        }
      });
    });

    telegram.on('message', function * () {
      if (this.state.done) return;
      const msg = this.message;
      const fromId = msg.from.id;
      groupsFor(fromId).then(groups => {
        Object.keys(groups).forEach(gid => {
          groups[gid].sendMessage(msg.text);
        })

      });
    });

  }
}
