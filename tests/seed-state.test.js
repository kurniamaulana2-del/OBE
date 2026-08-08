const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { newDb, DataType } = require('pg-mem');
const seedState = require('../database/seed-state');
const { seed } = require('../database/seed');
const { unseed } = require('../database/unseed');

test('seed imports the complete state and unseed removes it', async () => {
    const memoryDb = newDb({ autoCreateForeignKeyIndices: true });
    memoryDb.registerExtension('pgcrypto', schema => {
        schema.registerFunction({
            name: 'gen_random_uuid',
            returns: DataType.uuid,
            impure: true,
            implementation: randomUUID
        });
    });
    const adapter = memoryDb.adapters.createPg();
    const pool = new adapter.Pool();
    const schema = fs.readFileSync(path.join(__dirname, '..', 'database', 'schema.sql'), 'utf8');
    await pool.query(schema);

    const seedClient = await pool.connect();
    const seeded = await seed(seedClient);
    seedClient.release();

    assert.equal(seeded.users, seedState.accounts.length);
    assert.equal(seeded.courses, seedState.mkList.length);
    assert.equal(seeded.classes, Object.keys(seedState.classData).length);

    const expectedComponents = Object.values(seedState.classData)
        .reduce((total, cls) => total + (cls.komponenList || []).length, 0);
    const expectedStudents = Object.values(seedState.classData)
        .reduce((total, cls) => total + (cls.students || []).length, 0);
    const [programState, users, courses, classes, components, students] = await Promise.all([
        pool.query('SELECT payload FROM program_states WHERE study_program_id = $1', [seeded.prodiId]),
        pool.query('SELECT COUNT(*)::int AS count FROM users'),
        pool.query('SELECT COUNT(*)::int AS count FROM courses'),
        pool.query('SELECT COUNT(*)::int AS count FROM academic_classes'),
        pool.query('SELECT COUNT(*)::int AS count FROM assessment_components'),
        pool.query('SELECT COUNT(*)::int AS count FROM students')
    ]);

    assert.equal(users.rows[0].count, seedState.accounts.length);
    assert.equal(courses.rows[0].count, seedState.mkList.length);
    assert.equal(classes.rows[0].count, Object.keys(seedState.classData).length);
    assert.equal(components.rows[0].count, expectedComponents);
    assert.equal(students.rows[0].count, expectedStudents);
    assert.equal(programState.rows[0].payload.accounts, undefined);
    assert.equal(programState.rows[0].payload.masterData, undefined);
    assert.ok(Object.values(programState.rows[0].payload.classData)
        .every(cls => cls.prodiId === seeded.prodiId));

    const unseedClient = await pool.connect();
    const removed = await unseed(unseedClient);
    unseedClient.release();
    assert.equal(removed.users, seedState.accounts.length);
    assert.equal(removed.studyPrograms, 1);

    const remaining = await Promise.all([
        pool.query('SELECT COUNT(*)::int AS count FROM users'),
        pool.query('SELECT COUNT(*)::int AS count FROM program_states'),
        pool.query('SELECT COUNT(*)::int AS count FROM courses'),
        pool.query('SELECT COUNT(*)::int AS count FROM academic_classes')
    ]);
    remaining.forEach(result => assert.equal(result.rows[0].count, 0));
    await pool.end();
});
