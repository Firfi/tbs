const Promise = require('bluebird');
const R = require('ramda');
const uniqueId = require('lodash/uniqueId');

let store = [
  {
    type: 'text',
    text: 'test text record',
    fromId: 11111111,
    id: 'bbb1',
    rated: false,
    rates: []
  }
];

export const aspects = [
  {name: 'firstAspect', description: 'First aspect description'},
  {name: 'secondAspect', description: 'Second aspect description'},
  {name: 'thirdAspect', description: 'Third aspect description'}
];

const findUnrated = (uid) => R.find(R.both(R.propEq('rated', false), R.complement(R.propEq('fromId', uid))));

const getRecord = id => R.find(R.propEq('id', id))(store);

const MIN_RATE = 1;
const MAX_RATE = 5;
export const RATES = R.range(MIN_RATE, MAX_RATE + 1);

export const addRecord = (r) => {
  return new Promise(success => {
    store.push({...r, rated: false, id: uniqueId(), rates: []}); // rates : [{userId, aspect, rate}]
    success();
  });
};

export const popRecord = (uid) => { // TODO pop record strategy
  return new Promise(success => {
    success(findUnrated(uid)(store));
  });
};

export const getRatesFor = (recordId, uid) => {
  const r = getRecord(recordId);
  return new Promise(success => {
    return success(R.filter(R.propEq('userId', uid))(r.rates));
  });
};

export const rateRecord = (id, aspect, rate, uid) => { // TODO who rated?
  return new Promise((success, fail) => {
    const record = getRecord(id);
    if (!record) {
      fail(new Error(`No record with id ${id}`));
    } else {
      record.rated = true; // MUTATE. also TODO what is rated? one aspect? every?
      record.rates.push({
        userId: uid,
        aspect,
        rate
      }); // MUTATE
      success(record);
    }
  });
};
