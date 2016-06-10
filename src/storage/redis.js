const redis = require('redis');
import Promise from 'bluebird';
Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);

export default redis.createClient(process.env.REDISCLOUD_URL ? { url: process.env.REDISCLOUD_URL } : {
  host: process.env.TELEGRAM_SESSION_HOST || '127.0.0.1',
  port: process.env.TELEGRAM_SESSION_PORT || 6379
});
