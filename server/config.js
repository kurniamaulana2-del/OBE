const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const isProduction = process.env.NODE_ENV === 'production';
const jwtSecret = process.env.JWT_SECRET || (isProduction ? '' : 'development-only-secret-change-before-production');

if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must contain at least 32 characters.');
}

function getDatabaseSsl(value) {
    switch (value) {
        case 'disable':
            return false;
        case 'require':
            return { rejectUnauthorized: false };
        case 'verify-full':
            return { rejectUnauthorized: true };
        default:
            throw new Error('DATABASE_SSL must be disable, require, or verify-full.');
    }
}

module.exports = {
    port: Number.parseInt(process.env.PORT || '3000', 10),
    databaseSsl: getDatabaseSsl(process.env.DATABASE_SSL || (isProduction ? 'verify-full' : 'disable')),
    databaseUrl: process.env.DATABASE_URL || 'postgresql://obe_user:change_me@localhost:5432/obe',
    jwtSecret,
    isProduction
};
