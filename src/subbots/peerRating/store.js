const Promise = require('bluebird');
const R = require('ramda');
const uniqueId = require('lodash/uniqueId');
import mongoose from '../../model/index.js';

export const aspects = [
  {name: 'firstAspect', description: 'First aspect description'},
  {name: 'secondAspect', description: 'Second aspect description'},
  {name: 'thirdAspect', description: 'Third aspect description'}
];

const MIN_RATE = 1;
const MAX_RATE = 5;
export const RATES = R.range(MIN_RATE, MAX_RATE + 1);

// steps

export const START = 'start';
export const WAIT_FOR_ITEM = 'waitForItem'; // when we listen for user input with item to be rated
export const RATING = 'rating'; // and implicit step RECORD_RATING when there's RATING and record to rate id involved

export const STEPS = [START, WAIT_FOR_ITEM, RATING];

const Rate = new mongoose.Schema({
  fromId: Number,
  aspect: {
    type: String,
    'enum': R.map(R.prop('name'))(aspects)
  },
  rate: {
    type: Number,
    'enum': RATES
  }
});

const PeerRatingItem = mongoose.model('PeerRatingItem', {
  type: String,
  text: String,
  fromId: Number,
  id: String,
  rated: Boolean,
  rates: [Rate]
});

const PeerRatingSession = mongoose.model('PeerRatingSession', {
  userId: Number,
  step: {
    type: String,
    'enum': STEPS
  },
  recordToRateId: {
    type: Number
  }
});

//PeerRatingSession.pre('validate', function(next) { // TODO
//  if (this.recordToRateId && this.step !== RATING) {
//    next(Error(`recordToRateId not expected if step not ${RATING}`));
//  } else {
//    next();
//  }
//});

export const getInitialSession = () => {
  return new PeerRatingSession({
    step: START
  });
} ;

export const getSession = function * (userId) {
  let s = yield PeerRatingSession.findOne({userId}).exec();
  if (!s) {
    s = getInitialSession();
    s.userId = userId;
    yield s.save();
  }
  return s;
};

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

const findUnrated = (uid) => R.find(R.both(R.propEq('rated', false), R.complement(R.propEq('fromId', uid))));

const getRecord = id => R.find(R.propEq('id', id))(store);

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
