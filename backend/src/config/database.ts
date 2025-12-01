import { Pool, PoolConfig } from 'pg';
import { logger } from '../utils/logger';

const config: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'er_triage',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'changeme',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

export const pool = new Pool(config);

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export async function connectDatabase() {
  try {
    const client = await pool.connect();
    logger.info('Database connected successfully');
    client.release();
    return pool;
  } catch (error) {
    logger.error('Database connection error:', error);
    throw error;
  }
}

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    logger.error('Query error:', { text, error });
    throw error;
  }
}

