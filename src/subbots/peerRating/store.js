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

const Voice = new mongoose.Schema({
  file_id: String
});

const PeerRatingItem = mongoose.model('PeerRatingItem', {
  type: String,
  text: String,
  voice: Voice,
  fromId: Number,
  id: String,
  rated: Boolean,
  rates: [Rate]
});

export const PeerRatingSession = mongoose.model('PeerRatingSession', {
  userId: Number,
  step: {
    type: String,
    'enum': STEPS
  },
  recordToRateId: {
    type: String
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

export const getSession = function * (userId) { // for using in middleware
  let s = yield PeerRatingSession.findOne({userId}).exec();
  if (!s) {
    s = getInitialSession();
    s.userId = userId;
    yield s.save();
  }
  return s;
};

const findUnrated = (uid) => R.find(R.both(R.propEq('rated', false), R.complement(R.propEq('fromId', uid))));

export const addRecord = (r) => {
  return new PeerRatingItem({...r, rated: false, rates: []}).save();
};

export const popRecord = (uid) => { // TODO pop record strategy
  // send my items too! for developement.
  return PeerRatingItem.findOne({/*fromId: {$ne: uid},*/ rated: false});
};

export const rateRecord = (id, aspect, rate, uid) => { // TODO who rated?
  return PeerRatingItem.findByIdAndUpdate(id, {$push: {rates: {
    userId: uid,
    aspect,
    rate
  }}}).then(() => );
};
