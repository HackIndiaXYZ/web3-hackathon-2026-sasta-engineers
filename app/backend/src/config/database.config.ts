import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  url: process.env.DATABASE_URL,
  poolMin: parseInt(process.env.DB_POOL_MIN, 10) || 10,
  poolMax: parseInt(process.env.DB_POOL_MAX, 10) || 50,
  connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT, 10) || 30000,
}));
