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

let db;

export default (k) => db ? db.t(k) : (() => {throw new Error('messages db isnt initialized yet')})();

export const init = async () => {
  return await new Promise((success, fail) => {
    setTimeout(() => {
      db = new DB({
        'hello':
          'Hello! Write \n/rate to get into rate mode and \n/create to get into create mode. Write \n/start to see this message again.',
        'peer.rateFlow.postRateMenu.keyboard':
          `Select \n${postRateCommands.MORE_RATE} to get more item for rate, \n${postRateCommands.CREATE} to create an item, \n${postRateCommands.START} to move into main menu or \n${postRateCommands.STATS} to see your stats`,
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
      success();
    }, 100)
  })
};
