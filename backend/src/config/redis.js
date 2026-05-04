const { createClient } = require('redis');

let redisClient = null;
let isConnected = false;
const memoryCache = new Map();

const createRedisClient = async () => {
  if (redisClient) return redisClient;

  redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) return new Error('Redis max retries exceeded');
        return Math.min(retries * 100, 3000);
      },
    },
  });

  redisClient.on('connect', () => {
    isConnected = true;
    console.log('✅ Connected to Redis');
  });

  redisClient.on('error', (err) => {
    isConnected = false;
    console.warn('⚠️  Redis error (running without cache):', err.message);
  });

  redisClient.on('end', () => {
    isConnected = false;
  });

  try {
    await redisClient.connect();
  } catch (err) {
    console.warn('⚠️  Redis unavailable, continuing without cache:', err.message);
  }

  return redisClient;
};

const getRedis = () => redisClient;

const isRedisConnected = () => isConnected;

const cacheGet = async (key) => {
  if (!isConnected || !redisClient) {
    const item = memoryCache.get(key);
    if (!item) return null;
    if (Date.now() > item.expires) {
      memoryCache.delete(key);
      return null;
    }
    return item.value;
  }
  try {
    const val = await redisClient.get(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
};

const cacheSet = async (key, value, ttlSeconds = 300) => {
  if (!isConnected || !redisClient) {
    memoryCache.set(key, { value, expires: Date.now() + ttlSeconds * 1000 });
    return;
  }
  try {
    await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
  } catch {
    // silent fail
  }
};

const cacheDel = async (key) => {
  if (!isConnected || !redisClient) {
    memoryCache.delete(key);
    return;
  }
  try {
    await redisClient.del(key);
  } catch {
    // silent fail
  }
};

const cacheDelPattern = async (pattern) => {
  if (!isConnected || !redisClient) return;
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) await redisClient.del(keys);
  } catch {
    // silent fail
  }
};

module.exports = {
  createRedisClient,
  getRedis,
  isRedisConnected,
  cacheGet,
  cacheSet,
  cacheDel,
  cacheDelPattern,
};
