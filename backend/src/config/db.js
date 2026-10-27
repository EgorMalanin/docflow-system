const { Pool } = require('pg');
const Redis = require('ioredis');

// PostgreSQL
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'postgres',
  port: process.env.POSTGRES_PORT || 5432,
  user: process.env.POSTGRES_USER || 'docflow',
  password: process.env.POSTGRES_PASSWORD || 'docflow123',
  database: process.env.POSTGRES_DB || 'docflow_db',
});

// Redis
const redis = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: process.env.REDIS_PORT || 6379,
});

redis.on('connect', () => console.log('Redis connected'));
redis.on('error', (err) => console.error('Redis error:', err));

module.exports = { pool, redis };