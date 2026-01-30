require('dotenv').config();

module.exports = {
    PORT: process.env.PORT || 4000,
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-key-12345',
    REDIS_URL: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
    UPLOAD_DIR: 'uploads/'
};
