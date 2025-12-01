import { createClient } from 'redis';
import { logger } from '../utils/logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisClient = createClient({
  url: redisUrl,
});

redisClient.on('error', (err) => {
  logger.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  logger.info('Redis Client Connected');
});

export async function connectRedis() {
  try {
    await redisClient.connect();
    logger.info('Redis connected successfully');
    return redisClient;
  } catch (error) {
    logger.error('Redis connection error:', error);
    throw error;
  }
}

export async function getCache(key: string): Promise<string | null> {
  try {
    return await redisClient.get(key);
  } catch (error) {
    logger.error('Redis get error:', error);
    return null;
  }
}

export async function setCache(key: string, value: string, expiry?: number): Promise<void> {
  try {
    if (expiry) {
      await redisClient.setEx(key, expiry, value);
    } else {
      await redisClient.set(key, value);
    }
  } catch (error) {
    logger.error('Redis set error:', error);
  }
}

export async function deleteCache(key: string): Promise<void> {
  try {
    await redisClient.del(key);
  } catch (error) {
    logger.error('Redis delete error:', error);
  }
}

