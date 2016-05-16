const Promise = require('bluebird');
import { bot as telegram } from './telegram.js';

let groups = {}; // {groupId: metaGroup}

class MetaGroup {
  constructor() {
    this.uids = [];
  }
  join(uid) {
    return new Promise(success => {
      this.uids.push(uid);
      success(this);
    });
  }

  // proxy methods TODO generate on "meta" level
  sendMessage(message, props) {
    this.uids.forEach(uid =>
      telegram.sendMessage(uid, message, props)
    )
  }
  // proxy methods ^
}

export const getOrCreate = (id) => {
  return new Promise((success) => {
    success(groups[id] || (() => {
      const g = new MetaGroup();
      groups[id] = g;
      return g;
    })());
  });
};

export const join = (gid, uid) => {
  return getOrCreate(gid).then(group => group.join(uid));
};
