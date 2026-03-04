import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redis = createClient({
  url: process.env.REDIS_URL || 'redis://:redis_pass@redis:6379'
});

redis.on('error', (err) => console.log('Redis Error', err));
redis.on('connect', () => console.log('Redis connected'));

await redis.connect();

export default redis;
