const Promise = require('bluebird');
const R = require('ramda');
const uniqueId = require('lodash/uniqueId');

let store = [
  {
    type: 'voice',
    voice: {file_id: 'AwADAgADBAADxMsBB9ykt95_wj6WAg'},
    fromId: 117558212,
    id: 'bbb1',
    rated: false,
    rates: []
  }
];

const findUnrated = R.find(R.propEq('rated', false));

const getRecord = id => R.find(R.propEq('id', id))(store);

const MIN_RATE = 1;
const MAX_RATE = 5;
export const RATES = R.range(MIN_RATE, MAX_RATE + 1);

export const addRecord = (r) => {
  return new Promise(success => {
    store.push({...r, rated: false, id: uniqueId(), rates: []}); // TODO who rated?
    console.warn(store);
    success();
  });
};

export const popRecord = () => { // TODO pop record strategy
  return new Promise(success => {
    success(findUnrated(store));
  });
};

export const rateRecord = (id, rate) => { // TODO who rated?
  return new Promise((success, fail) => {
    const record = getRecord(id);
    if (!record) {
      fail(new Error(`No record with id ${id}`));
    } else {
      record.rated = true; // MUTATE
      record.rates.push(rate); // MUTATE
      success(record);
    }
  });
};
