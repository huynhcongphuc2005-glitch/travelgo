const path = require('path');
require('dotenv').config();

const env = process.env.NODE_ENV || 'development';

const config = {
  env,
  isTest: env === 'test',
  isProduction: env === 'production',
  port: Number(process.env.PORT) || 3000,
  jwtSecret: process.env.JWT_SECRET || 'dev-only-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  dbFile: path.resolve(
    process.env.DB_FILE || path.join(__dirname, '..', '..', 'data', 'db.json')
  ),
  corsOrigins: (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
};

if (config.isProduction && config.jwtSecret === 'dev-only-secret-change-me') {
  throw new Error('JWT_SECRET phải được đặt khi chạy ở môi trường production');
}

module.exports = config;
