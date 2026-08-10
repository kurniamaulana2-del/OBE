const { createApp } = require('../server/app');
const { pool } = require('../server/db');

module.exports = createApp({ pool });
