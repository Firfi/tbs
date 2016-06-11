import postRateCommands from '../peerBot/flows/rateFlow/postRateCommands'; // TODO looks really ugly. is it good idea to keep it in one file?

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
  'peer.rateFlow.postRateMenu.keyboard': 
    `Select ${postRateCommands.MORE_RATE} to get more item for rate, ${postRateCommands.CREATE} to create an item, ${postRateCommands.START} to move into main menu or ${postRateCommands.STATS} to see your stats`,
  'peer.rateFlow.intro.itemToRate': 
    'Item to rate: (intro text)',
  'peer.rateFlow.outro': 
    'Outro text here',
  'peer.rateFlow.rateWIP.noRecordsToRate': 
    'No records to rate',
  'peer.rateFlow.rateWIP.wrongEvent': 
    'Please rate an item with inline keyboard',
  'peer.rateFlow.notifier.rated': 
    'Your item have been rated:',
  'peer.createFlow.recordAdded':
    'Record added.',
  'peer.createFlow.addYourItem': 
    'Add your item to rate',
  'peer.firstAspect': 
    'First aspect desc',
  'peer.secondAspect':
    'Second aspect desc',
  'peer.thirdAspect':
    'Third aspect desc'
});

export default (k) => db.t(k);
