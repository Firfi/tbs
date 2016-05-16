const Promise = require('bluebird');
import { bot as telegram } from './telegram.js';

let groups = {}; // {groupId: metaGroup}
let groupsByUsers = {}; // {uid: {gid: {}}} // cache

class MetaGroup {
  constructor(id) {
    this.id = id;
    this.users = {}; // {uid: {user info?}}
  }

  join(uid) {
    return new Promise(success => {
      // check if already joined. no sense to join again.
      if (this.users[uid]) return success(false);
      this.users[uid] = {};
      if (!groupsByUsers[uid]) groupsByUsers[uid] = {};
      groupsByUsers[uid][this.id] = this;
      success(true);
    });
  }

  leave(uid) { // will return falsy if no users really left
    return new Promise(success => {
      if (!this.users[uid]) return success(false); // nothing to leave but not a failure (suppose so?)
      delete this.users[uid];
      delete groupsByUsers[uid][this.id];
      success(true);
    });
  }

  // proxy methods TODO generate on "meta" level
  sendMessage(message, props) {
    return new Promise(success => {
      // TODO asyncjs
      Object.keys(this.users).forEach(uid => {
        telegram.sendMessage(uid, message, props).catch(e => console.error(e));
      });
      success();
    });
  }
  // proxy methods ^
}

export const getOrCreate = (id) => {
  return get(id).then(group => {
    return group || (() => {
      const g = new MetaGroup(id);
      groups[id] = g;
      return g;
    })();
  });
};

export const get = id => {
  return new Promise(success => {
    success(groups[id]);
  });
};

export const join = (gid, uid) => {
  return getOrCreate(gid).then(group => {
    return group.join(uid).then(ok => {
      return { ok, group };
    });
  });
};

export const leave = (gid, uid) => {
  return get(gid).then(group => {
    if (group) {
      return group.leave(uid);
    } // else nothing to leave. safe to ignore but actually may be wrong operation. most probably safe though
  });
};

export const groupsFor = uid => {
  return new Promise(success => {
    success(groupsByUsers[uid] || {});
  });
};
