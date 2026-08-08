const { pool } = require('./db');
const { createApp } = require('./app');
const config = require('./config');

const app = createApp({ pool });
const server = app.listen(config.port, () => {
    console.log(`OBE server listening on http://localhost:${config.port}`);
});

async function shutdown(signal) {
    console.log(`${signal} received, shutting down.`);
    server.close(async () => {
        await pool.end();
        process.exit(0);
    });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
