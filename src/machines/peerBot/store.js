const Promise = require('bluebird');
const R = require('ramda');
const uniqueId = require('lodash/uniqueId');
import mongoose from '../../model/index.js';
import messages from './views/messages'

export const aspects = [
  {name: 'firstAspect', description: messages.firstAspect},
  {name: 'secondAspect', description: messages.secondAspect},
  {name: 'thirdAspect', description: messages.thirdAspect}
];

const MIN_RATE = 1;
const MAX_RATE = 5;
export const RATES = R.range(MIN_RATE, MAX_RATE + 1);

// steps

export const START = 'start';
export const WAIT_FOR_ITEM = 'waitForItem'; // when we listen for user input with item to be rated
export const RATING = 'rating'; // and implicit step RECORD_RATING when there's RATING and record to rate id involved
export const ONBOARDING = 'onboarding';
export const WAIT_FOR_NAME = 'waitForName';

export const STEPS = [START, WAIT_FOR_ITEM, RATING, ONBOARDING, WAIT_FOR_NAME];

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
}, {timestamps: true});

const mediaSchema = () => new mongoose.Schema({
  file_id: String
});

const Voice = mediaSchema();
const Video = mediaSchema();
const Photo = new mongoose.Schema({
  file_id: String,
  width: Number,
  height: Number,
  file_size: Number
});

const PeerRatingItem = mongoose.model('PeerRatingItem', new mongoose.Schema({
  type: String,
  text: String,
  voice: Voice,
  video: Video,
  photo: [Photo],
  fromId: Number,
  chatId: Number,
  rated: Boolean,
  rates: [Rate]
}, {timestamps: true}));

const PeerRatingSession = mongoose.model('PeerRatingSession', new mongoose.Schema({
  userId: Number,
  chatId: Number, // TODO
  userName: String, // why not outside: peerRating askin for name, other bot askin for name.. now what?
  step: {
    type: String,
    'enum': STEPS
  },
  recordToRateId: {
    type: String
  }
}, {timestamps: true}));

const PeerRatingRateNotification = mongoose.model('PeerRatingRateNotification', new mongoose.Schema({
  ratedById: Number,
  itemId: String,
  userId: Number // DENORMALISE!!! but we don't want to pop all user records?
}, {timestamps: true}));

export const getInitialSession = () => {
  return new PeerRatingSession({
    step: START,
    route: '/'
  });
} ;

export const getSession = function * (userId) { // for using in middleware
  let s = yield getSessionPromise(userId).exec();
  if (!s) {
    s = getInitialSession();
    s.userId = userId;
    yield s.save();
  }
  return s;
};

export const getSessionPromise = (userId) => {
  return PeerRatingSession.findOne({ userId });
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

export const getRecord = (id) => {
  return PeerRatingItem.findById(id);
};

export const rateRecord = (id, aspect, rate, telegramId) => { // TODO who rated?
  return PeerRatingItem.findById(id).then(record => {
    record.rates.push({
      fromId: telegramId,
      aspect,
      rate
    });
    if (shouldMarkItemRated(record, telegramId)) {
      record.rated = true;
    }
    return record.save();
  });
  // return PeerRatingItem.findByIdAndUpdate(id, {$push: {rates: }}).then((r) => PeerRatingItem.findById(id)).then(r => console.warn('r.rates', r.rates, r.rates.length) || r).catch(e => console.error(e)); // TODO in one request.
};

export const storeRateNotification = (record, ratedById) => {
  return new PeerRatingRateNotification({
    itemId: record._id,
    userId: record.fromId,
    ratedById
  }).save();
};

export const ratesForRecord = (record, ratedById) => {
  return R.pipe(
    R.filter(R.propEq('fromId', ratedById)),
    R.sortBy(R.prop('createdAt')),
    R.uniqBy(R.prop('aspect')) // ASSUME all aspects is there (no harm otherwise)
  )(record.rates);
};

export const popRateNotifications = uid => {
  return PeerRatingRateNotification.find({
    userId: uid
  }).then(ns => Promise.all(ns.map(notification => {
    return PeerRatingItem.findById(notification.itemId).then(record => {
      return { record, notification }; // sic! otherwise, if one item rated by two users - very tricky to find bug.
    }).then(result => notification.remove().then(_ => result)); // remove it right after getting
  })));
};
