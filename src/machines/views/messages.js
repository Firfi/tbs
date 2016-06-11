import postRateCommands from '../peerBot/postRateCommands';

class DB {
  constructor(db) {
    this.db = db;
  }
  t(k) {
    const v = this.db[k];
    if (typeof v === 'undefined') {
      throw new Error(`no such key ${k} in texts db`);
    }
    return v;
  }
}

const db = new DB({
  'peer.rateFlow.postRateMenu.keyboard': `Select ${postRateCommands.MORE_RATE} to get more item for rate, ${postRateCommands.CREATE} to create an item, ${postRateCommands.START} to move into main menu or ${postRateCommands.STATS} to see your stats`
});

export default (k) => db.t(k);
