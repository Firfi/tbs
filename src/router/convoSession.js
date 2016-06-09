const convoKey = key => `convo:${key}`;

import redis from '../storage/redis.js';

export async function getConvo(key) { // key is uid, uid:chatid, system:uid:chatid (where system is telegram/facebook) etc.
  if (!key) throw new Error('no key provided');
  const redisKey = convoKey(key);
  let convoJSONString = await redis.getAsync(redisKey);
  let convo = convoJSONString && JSON.parse(convoJSONString);
  if (!convo) {
    convo = {locked: false, sessionKey: key/*for updates*/};
    await setConvo(key, convo);
  }
  return convo;
}

export async function setConvo(key, convo) {
  console.warn('key', key);
  const redisKey = convoKey(key);
  return await redis.setAsync(redisKey, JSON.stringify(convo));
}

async function setLock(key, lock) {
  const convo = await redis.getAsync(convoKey(key));
  convo.locked = !!lock;
  return await setConvo(key, convo);
}

export async function lock(key) {
  return await setLock(key, true);
}

export async function unlock(key) {
  return await setLock(key, false);
}
