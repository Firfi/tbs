import mongoose from '../../storage/mongo';

const MessagesSchema = new mongoose.Schema({
  data: mongoose.Schema.Types.Mixed
});

const Messages = mongoose.model('Messages', MessagesSchema);

class DB {
  constructor(db) {
    this.db = db;
  }
  t(k) {
    const v = this.db[k];
    if (typeof v === 'undefined') {
      return k;
      //throw new Error(`no such key ${k} in texts db`);
    }
    return v;
  }
}

let db;

export default (k) => db ? db.t(k) : (() => {throw new Error('messages db isnt initialized yet')})();

export const init = async () => {
  try {
    let messages = await Messages.findOne({});
    if (!messages) {
      // init
      messages = new Messages({
        data: JSON.stringify({
          'hello':
            'Hello! Write \n/rate to get into rate mode and \n/create to get into create mode. Write \n/start to see this message again.',
          'peer.rateFlow.postRateMenu.keyboard':
            `Select /rate to get more item for rate, /create to create an item, \n/start to move into main menu or \n/stats to see your stats`,
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
        })
      });
      await messages.save();
    }
    db = new DB(JSON.parse(messages.data));
  } catch (e) {
    console.error(e);
  }

};
