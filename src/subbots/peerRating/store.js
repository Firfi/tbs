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

const shouldMarkItemRated = (record, uid) => {
  const uniqAspectsForUser = R.pipe(
    R.filter(R.propEq('fromId', uid)),
    R.map(R.prop('aspect')),
    R.uniq
  )(record.rates);
  return uniqAspectsForUser.length === aspects.length;
};

export const rateRecord = (id, aspect, rate, uid) => { // TODO who rated?
  return PeerRatingItem.findById(id).then(record => {
    record.rates.push({
      fromId: uid,
      aspect,
      rate
    });
    if (shouldMarkItemRated(record, uid)) {
      record.rated = true;
    }
    return record.save();
  });
  // return PeerRatingItem.findByIdAndUpdate(id, {$push: {rates: }}).then((r) => PeerRatingItem.findById(id)).then(r => console.warn('r.rates', r.rates, r.rates.length) || r).catch(e => console.error(e)); // TODO in one request.
};
