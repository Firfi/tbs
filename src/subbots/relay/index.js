import { join as joinMetaGroup, groupsFor, get as getGroup } from '../../metagroup.js';
import { Route } from '../../router.js';

export default
class Relay extends Route {
  welcome() {
    return 'welcome to relay bot. type /join group_name or /leave group_name and do your messaging as usual.';
  }
  constructor(name) {
    super(name);

    const telegram = this.telegram;

    telegram.hears(/^\/join (\w+)/, function * () { // TODO generic functionality for all metaGroup bots. leave/join/etc
      const gid = this.match[1]; // new msg.chat.id actually
      const msg = this.message;
      const fromId = msg.from.id;
      joinMetaGroup(gid, fromId).then(({ group, ok }) => {
        if (ok) return group.sendMessage(`user ${fromId} joined`); // TODO user name
      });
    });

    telegram.hears(/^\/leave (\w+)/, function * () {
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

    telegram.on('message', function * (next) {
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
