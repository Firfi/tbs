const clone = require('lodash/clone');

const convoKey = key => `convo:${key}`;


import redis from '../storage/redis.js';

async function _getConvo(key) {
  const redisKey = convoKey(key);
  let convoJSONString = await redis.getAsync(redisKey);
  return convoJSONString && JSON.parse(convoJSONString);
}

export async function getConvo(key) { // key is uid, uid:chatid, system:uid:chatid (where system is telegram/facebook) etc.
  if (!key) throw new Error('no key provided');
  let convo = await _getConvo(key);
  if (!convo) {
    convo = {locked: false, sessionKey: key/*for updates*/};
    await setConvo(key, convo);
  }
  return convo;
}

export async function setConvo(key, state) {
  state = clone(state);
  delete state.convo;
  const redisKey = convoKey(key);
  return await redis.setAsync(redisKey, JSON.stringify(state));
}

async function setLock(key, lock) {
  if (!key) throw new Error('no key provided for lock/unlock');
  const convo = _getConvo(key);
  if (!convo) throw new Error(`no convo by key ${key}`);
  convo.locked = !!lock;
  return await setConvo(key, convo);
}

export async function lock(key) {
  return await setLock(key, true);
}

export async function unlock(key) {
  return await setLock(key, false);
}
