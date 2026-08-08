const test = require('node:test');
const assert = require('node:assert/strict');
const { unseed } = require('../database/unseed');

function createClient(responses) {
    const queries = [];
    return {
        queries,
        async query(sql, params) {
            queries.push({ sql, params });
            const response = responses.shift();
            if (response instanceof Error) throw response;
            return response || { rows: [], rowCount: 0 };
        }
    };
}

test('unseed removes seeded records in a transaction', async () => {
    const client = createClient([
        { rows: [], rowCount: 0 },
        { rows: [{ id: '00000000-0000-0000-0000-000000000001', facultyId: '00000000-0000-0000-0000-000000000002' }] },
        { rows: [], rowCount: 0 },
        { rows: [], rowCount: 1 },
        { rows: [], rowCount: 4 },
        { rows: [], rowCount: 1 },
        { rows: [], rowCount: 1 },
        { rows: [], rowCount: 1 },
        { rows: [], rowCount: 0 }
    ]);

    const result = await unseed(client);

    assert.deepEqual(result, {
        users: 4,
        studyPrograms: 1,
        faculties: 1,
        academicYears: 1
    });
    assert.equal(client.queries[0].sql, 'BEGIN');
    assert.match(client.queries[3].sql, /DELETE FROM class_lecturers/);
    assert.match(client.queries[4].sql, /DELETE FROM users/);
    assert.match(client.queries[5].sql, /DELETE FROM study_programs/);
    assert.equal(client.queries.at(-1).sql, 'COMMIT');
});

test('unseed rolls back when demo users are assigned outside the seeded program', async () => {
    const client = createClient([
        { rows: [], rowCount: 0 },
        { rows: [{ id: '00000000-0000-0000-0000-000000000001', facultyId: '00000000-0000-0000-0000-000000000002' }] },
        { rows: [{ username: 'dosen' }], rowCount: 1 },
        { rows: [], rowCount: 0 }
    ]);

    await assert.rejects(
        unseed(client),
        /akun demo masih digunakan pada kelas di program studi lain \(dosen\)/
    );
    assert.equal(client.queries.at(-1).sql, 'ROLLBACK');
    assert.equal(client.queries.some(query => /DELETE FROM/.test(query.sql)), false);
});
