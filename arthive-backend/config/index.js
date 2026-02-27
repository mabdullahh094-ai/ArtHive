const dotenv = require('dotenv');
dotenv.config();

const parseOrigins = () => {
  const fromEnv = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const fallbackOrigins = [
    process.env.CLIENT_URL,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ].filter(Boolean);

  return [...new Set([...fromEnv, ...fallbackOrigins])];
};

module.exports = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  cors: {
    origin: parseOrigins(),
  },
};
