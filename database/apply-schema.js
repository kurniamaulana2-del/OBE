const fs = require('node:fs/promises');
const path = require('node:path');
const { pool } = require('../server/db');

async function main() {
    const schema = await fs.readFile(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(schema);
    console.log('Database schema applied.');
}

main()
    .catch(error => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(() => pool.end());
