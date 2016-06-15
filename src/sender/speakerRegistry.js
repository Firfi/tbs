const toPairs = require('lodash/toPairs');
const fromPairs = require('lodash/fromPairs');
const first = require('lodash/first');
const compact = require('lodash/compact');
import R from 'ramda';

const speakerRegistry = {};

export const addSpeaker = (namespace, speaker) => {speakerRegistry[namespace] = speaker};

export const getSpeaker = namespace => {
  const parts = namespace.split('.');
  // no root TODO
  const possibleNamespaces = R.reverse(R.range(1, parts.length + 1)).map(n => { // [] for (1,1)
    return parts.slice(0, n).join('.');
  });
  const possibleSpeakers = compact(possibleNamespaces.map(ns => speakerRegistry[ns]));
  return first(possibleSpeakers);
};
