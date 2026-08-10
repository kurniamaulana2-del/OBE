const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const bcrypt = require('bcryptjs');
const request = require('supertest');
const { newDb, DataType } = require('pg-mem');
const { createApp } = require('../server/app');

let pool;
let app;
let ids;

async function addUser({ username, password, name, role, facultyId = null, prodiId = null }) {
    const passwordHash = await bcrypt.hash(password, 4);
    const result = await pool.query(
        `INSERT INTO users (faculty_id, study_program_id, username, password_hash, name, role)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [facultyId, prodiId, username, passwordHash, name, role]
    );
    return result.rows[0].id;
}

async function login(username, password) {
    const response = await request(app).post('/api/auth/login').send({ username, password });
    assert.equal(response.status, 200);
    return response.body.token;
}

test('serves only intended public files', async () => {
    const home = await request(app).get('/');
    assert.equal(home.status, 200);
    assert.match(home.text, /<!DOCTYPE html>/i);

    const stylesheet = await request(app).get('/assets/css/app.css');
    assert.equal(stylesheet.status, 200);

    const source = await request(app).get('/server/app.js');
    assert.equal(source.status, 404);
});

beforeEach(async () => {
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
    pool = new adapter.Pool();
    const schema = fs.readFileSync(path.join(__dirname, '..', 'database', 'schema.sql'), 'utf8');
    await pool.query(schema);

    const facultyA = await pool.query(
        `INSERT INTO faculties (code, name) VALUES ('FA', 'Faculty A') RETURNING id`
    );
    const facultyB = await pool.query(
        `INSERT INTO faculties (code, name) VALUES ('FB', 'Faculty B') RETURNING id`
    );
    const prodiA = await pool.query(
        `INSERT INTO study_programs (faculty_id, code, name) VALUES ($1, 'PA', 'Program A') RETURNING id`,
        [facultyA.rows[0].id]
    );
    const prodiB = await pool.query(
        `INSERT INTO study_programs (faculty_id, code, name) VALUES ($1, 'PB', 'Program B') RETURNING id`,
        [facultyB.rows[0].id]
    );
    const yearA = await pool.query(
        `INSERT INTO academic_years (code, term) VALUES ('2026/2027', 'Ganjil') RETURNING id`
    );

    ids = {
        facultyA: facultyA.rows[0].id,
        facultyB: facultyB.rows[0].id,
        prodiA: prodiA.rows[0].id,
        prodiB: prodiB.rows[0].id,
        yearA: yearA.rows[0].id
    };
    ids.admin = await addUser({
        username: 'admin-test', password: 'AdminTest123!', name: 'Admin', role: 'administrator'
    });
    ids.lecturerA = await addUser({
        username: 'dosen-a', password: 'DosenTest123!', name: 'Lecturer A', role: 'dosen',
        facultyId: ids.facultyA, prodiId: ids.prodiA
    });
    ids.managerA = await addUser({
        username: 'kaprodi-a', password: 'ManagerTest123!', name: 'Manager A', role: 'kaprodi',
        facultyId: ids.facultyA, prodiId: ids.prodiA
    });
    ids.lecturerB = await addUser({
        username: 'dosen-b', password: 'DosenTest123!', name: 'Lecturer B', role: 'dosen',
        facultyId: ids.facultyB, prodiId: ids.prodiB
    });
    app = createApp({ pool });
});

afterEach(async () => {
    await pool.end();
});

test('bootstrap only returns the authenticated faculty and study program', async () => {
    const token = await login('dosen-a', 'DosenTest123!');
    const response = await request(app)
        .get('/api/bootstrap')
        .set('Authorization', `Bearer ${token}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.masterData.faculties.length, 1);
    assert.equal(response.body.masterData.faculties[0].id, ids.facultyA);
    assert.equal(response.body.masterData.studyPrograms.length, 1);
    assert.equal(response.body.masterData.studyPrograms[0].id, ids.prodiA);
    assert.ok(response.body.user.permissions.includes('pl'));
    assert.ok(response.body.user.permissions.includes('setup_perkuliahan'));
    assert.deepEqual(
        new Set(response.body.lecturers.map(item => item.id)),
        new Set([ids.lecturerA, ids.managerA, ids.lecturerB])
    );
});

test('non-administrator cannot request or save another study program', async () => {
    const token = await login('dosen-a', 'DosenTest123!');
    const bootstrap = await request(app)
        .get(`/api/bootstrap?prodiId=${ids.prodiB}`)
        .set('Authorization', `Bearer ${token}`);
    assert.equal(bootstrap.status, 403);

    const save = await request(app)
        .put('/api/program-state')
        .set('Authorization', `Bearer ${token}`)
        .send({ prodiId: ids.prodiB, version: 0, payload: { mkList: [], classData: {} } });
    assert.equal(save.status, 403);
});

test('account tenant is validated and academic years are global', async () => {
    const token = await login('admin-test', 'AdminTest123!');
    const response = await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${token}`)
        .send({
            username: 'invalid-tenant',
            password: 'Password123!',
            name: 'Invalid Tenant',
            role: 'dosen',
            facultyId: ids.facultyA,
            prodiId: ids.prodiB
        });
    assert.equal(response.status, 400);
    assert.match(response.body.error, /does not belong/i);

    const year = await request(app)
        .post('/api/master/academic-years')
        .set('Authorization', `Bearer ${token}`)
        .send({ code: '2027/2028', term: 'Ganjil' });
    assert.equal(year.status, 201);
    assert.equal(year.body.item.code, '2027/2028');
    assert.equal(year.body.item.prodiId, undefined);
});

test('administrator can reset a password and the old password stops working', async () => {
    const token = await login('admin-test', 'AdminTest123!');
    const oldLecturerToken = await login('dosen-a', 'DosenTest123!');
    const reset = await request(app)
        .post(`/api/accounts/${ids.lecturerA}/reset-password`)
        .set('Authorization', `Bearer ${token}`)
        .send({ password: 'ChangedPassword123!' });
    assert.equal(reset.status, 204);

    const oldLogin = await request(app)
        .post('/api/auth/login')
        .send({ username: 'dosen-a', password: 'DosenTest123!' });
    assert.equal(oldLogin.status, 401);
    await login('dosen-a', 'ChangedPassword123!');

    const revokedSession = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${oldLecturerToken}`);
    assert.equal(revokedSession.status, 401);
});

test('every account can change its own password and continue with a refreshed session', async () => {
    const oldToken = await login('dosen-a', 'DosenTest123!');
    const incorrect = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${oldToken}`)
        .send({ currentPassword: 'WrongPassword123!', newPassword: 'OwnChangedPassword123!' });
    assert.equal(incorrect.status, 401);

    const changed = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${oldToken}`)
        .send({ currentPassword: 'DosenTest123!', newPassword: 'OwnChangedPassword123!' });
    assert.equal(changed.status, 200);
    assert.ok(changed.body.token);

    const revokedSession = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${oldToken}`);
    assert.equal(revokedSession.status, 401);

    const refreshedSession = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${changed.body.token}`);
    assert.equal(refreshedSession.status, 200);

    const oldLogin = await request(app)
        .post('/api/auth/login')
        .send({ username: 'dosen-a', password: 'DosenTest123!' });
    assert.equal(oldLogin.status, 401);
    await login('dosen-a', 'OwnChangedPassword123!');
});

test('administrator can save and lock a custom menu permission matrix', async () => {
    const token = await login('admin-test', 'AdminTest123!');
    const save = await request(app)
        .patch(`/api/accounts/${ids.lecturerA}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ permissions: ['rps', 'presensi'], permissionsLocked: true });
    assert.equal(save.status, 200);
    assert.deepEqual(save.body.account.permissions, ['rps', 'presensi']);
    assert.equal(save.body.account.permissionsLocked, true);

    const blocked = await request(app)
        .patch(`/api/accounts/${ids.lecturerA}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ permissions: ['rps'] });
    assert.equal(blocked.status, 409);

    const unlock = await request(app)
        .patch(`/api/accounts/${ids.lecturerA}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ permissionsLocked: false });
    assert.equal(unlock.status, 200);
    assert.equal(unlock.body.account.permissionsLocked, false);
});

test('program state is normalized transactionally and rejects overlap', async () => {
    const token = await login('kaprodi-a', 'ManagerTest123!');
    const payload = {
        mkList: [{ id: 'MK1', code: 'CODE1', name: 'Course 1', semester: '1' }],
        classData: {
            CLASS_A: {
                prodiId: ids.prodiA,
                academicYearId: ids.yearA,
                mkId: 'MK1',
                kelas: 'A',
                semester: '1',
                lecturerIds: [ids.lecturerA, ids.lecturerB],
                pjmkLecturerId: ids.lecturerA,
                locked: true,
                rpsFinalized: false,
                rps: { identitas: { deskripsiMK: 'Reusable RPS' } },
                komponenList: [{ id: 'K1', name: 'Assignment', jenis: 'Tugas' }],
                students: [{ nim: '001', name: 'Student', scores: { K1: 88 } }],
                attendance: { '001': { 1: 'hadir' } }
            },
            CLASS_DRAFT: {
                prodiId: ids.prodiA,
                academicYearId: ids.yearA,
                mkId: 'MK1',
                kelas: 'DRAFT',
                semester: '1',
                lecturerIds: [ids.lecturerA],
                pjmkLecturerId: ids.lecturerA,
                locked: false,
                rpsFinalized: false,
                komponenList: [],
                students: []
            }
        }
    };
    const save = await request(app)
        .put('/api/program-state')
        .set('Authorization', `Bearer ${token}`)
        .send({ prodiId: ids.prodiA, version: 0, payload });
    assert.equal(save.status, 200, JSON.stringify(save.body));
    assert.equal(save.body.version, 1);

    const templates = await request(app)
        .get('/api/rps-templates?courseCode=CODE1')
        .set('Authorization', `Bearer ${token}`);
    assert.equal(templates.status, 200);
    assert.equal(templates.body.templates.length, 1);
    assert.equal(templates.body.templates[0].academicYear, '2026/2027 - Ganjil');

    const [classes, lecturers, scores, attendance] = await Promise.all([
        pool.query('SELECT COUNT(*)::int AS count FROM academic_classes WHERE study_program_id = $1', [ids.prodiA]),
        pool.query('SELECT COUNT(*)::int AS count FROM class_lecturers WHERE study_program_id = $1', [ids.prodiA]),
        pool.query('SELECT COUNT(*)::int AS count FROM student_scores'),
        pool.query('SELECT COUNT(*)::int AS count FROM attendance_records')
    ]);
    assert.equal(classes.rows[0].count, 2);
    assert.equal(lecturers.rows[0].count, 3);
    assert.equal(scores.rows[0].count, 1);
    assert.equal(attendance.rows[0].count, 1);

    const unassignedManagerRps = structuredClone(payload);
    unassignedManagerRps.classData.CLASS_A.rps = { identitas: { deskripsiMK: 'Unauthorized change' } };
    const forbiddenManagerRps = await request(app)
        .put('/api/program-state')
        .set('Authorization', `Bearer ${token}`)
        .send({ prodiId: ids.prodiA, version: 1, payload: unassignedManagerRps });
    assert.equal(forbiddenManagerRps.status, 403);

    const externalLecturerToken = await login('dosen-b', 'DosenTest123!');
    const externalBootstrap = await request(app)
        .get(`/api/bootstrap?prodiId=${ids.prodiA}`)
        .set('Authorization', `Bearer ${externalLecturerToken}`);
    assert.equal(externalBootstrap.status, 200);
    assert.deepEqual(Object.keys(externalBootstrap.body.programState.payload.classData), ['CLASS_A']);
    assert.deepEqual(
        new Set(externalBootstrap.body.masterData.studyPrograms.map(program => program.id)),
        new Set([ids.prodiA, ids.prodiB])
    );
    const nonPjmkRpsPayload = structuredClone(externalBootstrap.body.programState.payload);
    nonPjmkRpsPayload.classData.CLASS_A.rps.identitas.deskripsiMK = 'Non-PJMK change';
    const nonPjmkRpsSave = await request(app)
        .put('/api/program-state')
        .set('Authorization', `Bearer ${externalLecturerToken}`)
        .send({ prodiId: ids.prodiA, version: 1, payload: nonPjmkRpsPayload });
    assert.equal(nonPjmkRpsSave.status, 403);
    assert.match(nonPjmkRpsSave.body.error, /PJMK/i);

    const lecturerToken = await login('dosen-a', 'DosenTest123!');
    const lecturerBootstrap = await request(app)
        .get('/api/bootstrap')
        .set('Authorization', `Bearer ${lecturerToken}`);
    assert.deepEqual(Object.keys(lecturerBootstrap.body.programState.payload.classData), ['CLASS_A']);

    const forbiddenPayload = structuredClone(lecturerBootstrap.body.programState.payload);
    forbiddenPayload.mkList[0].name = 'Tampered Curriculum';
    const forbidden = await request(app)
        .put('/api/program-state')
        .set('Authorization', `Bearer ${lecturerToken}`)
        .send({ prodiId: ids.prodiA, version: 1, payload: forbiddenPayload });
    assert.equal(forbidden.status, 403);

    const lecturerPayload = structuredClone(lecturerBootstrap.body.programState.payload);
    lecturerPayload.classData.CLASS_A.students[0].scores.K1 = 91;
    lecturerPayload.classData.CLASS_A.rps.identitas.deskripsiMK = 'PJMK authorized change';
    const lecturerSave = await request(app)
        .put('/api/program-state')
        .set('Authorization', `Bearer ${lecturerToken}`)
        .send({ prodiId: ids.prodiA, version: 1, payload: lecturerPayload });
    assert.equal(lecturerSave.status, 200);
    assert.equal(lecturerSave.body.version, 2);

    const conflict = await request(app)
        .put('/api/program-state')
        .set('Authorization', `Bearer ${token}`)
        .send({ prodiId: ids.prodiA, version: 1, payload });
    assert.equal(conflict.status, 409);

    payload.classData.CLASS_A.rps = structuredClone(lecturerPayload.classData.CLASS_A.rps);
    payload.classData.CLASS_A.students[0].scores.K1 = 91;
    payload.classData.CLASS_A.lecturerIds = [ids.lecturerB];
    payload.classData.CLASS_A.pjmkLecturerId = ids.lecturerB;
    const crossProgramAssignment = await request(app)
        .put('/api/program-state')
        .set('Authorization', `Bearer ${token}`)
        .send({ prodiId: ids.prodiA, version: 2, payload });
    assert.equal(crossProgramAssignment.status, 200);

    const version = await pool.query('SELECT version FROM program_states WHERE study_program_id = $1', [ids.prodiA]);
    assert.equal(version.rows[0].version, 3);

    payload.classData.CLASS_A.lecturerIds = [ids.lecturerA];
    payload.classData.CLASS_A.pjmkLecturerId = ids.lecturerA;
    const auditSave = await request(app)
        .put('/api/program-state')
        .set('Authorization', `Bearer ${token}`)
        .send({ prodiId: ids.prodiA, version: 3, payload });
    assert.equal(auditSave.status, 200);
    assert.equal(auditSave.body.version, 4);

    const adminToken = await login('admin-test', 'AdminTest123!');
    const assignedDelete = await request(app)
        .delete(`/api/accounts/${ids.lecturerA}`)
        .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(assignedDelete.status, 409);
    assert.match(assignedDelete.body.error, /assigned as a class lecturer/i);

    const managerDelete = await request(app)
        .delete(`/api/accounts/${ids.managerA}`)
        .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(managerDelete.status, 204);
    const auditReference = await pool.query(
        'SELECT updated_by AS "updatedBy" FROM program_states WHERE study_program_id = $1',
        [ids.prodiA]
    );
    assert.equal(auditReference.rows[0].updatedBy, null);
});

test('administrator cannot write academic program state', async () => {
    const token = await login('admin-test', 'AdminTest123!');
    const response = await request(app)
        .put('/api/program-state')
        .set('Authorization', `Bearer ${token}`)
        .send({ prodiId: ids.prodiA, version: 0, payload: { mkList: [], classData: {} } });
    assert.equal(response.status, 403);
});
