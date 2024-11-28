const redis = require('../config/redis');

async function deleteAllRedis() {
  try {
    const keys = await redis.keys('*');
    if (keys.length > 0) {
      await redis.del(keys);
    }
  } catch (error) {
    console.log(error);
  }
}

module.exports = deleteAllRedis;
