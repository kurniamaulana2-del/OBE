const path = require('node:path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bcrypt = require('bcryptjs');
const { isDeepStrictEqual } = require('node:util');
const { signAccessToken, createAuthMiddleware, requireAdministrator } = require('./auth');

class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

const asyncRoute = handler => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const MENU_IDS = [
    'accounts', 'master_data', 'pl', 'cpl', 'matriks_cpl_pl', 'mk', 'cpmk',
    'setup_perkuliahan', 'rps', 'input_nilai', 'presensi',
    'mon_komponen', 'mon_subcpmk', 'mon_cpmk', 'mon_cpl'
];
const ROLE_PERMISSIONS = {
    administrator: MENU_IDS,
    kaprodi: MENU_IDS.filter(id => !['accounts', 'master_data'].includes(id)),
    gkm: MENU_IDS.filter(id => !['accounts', 'master_data'].includes(id)),
    dosen: MENU_IDS.filter(id => !['accounts', 'master_data'].includes(id))
};

function normalizePermissions(value, role) {
    if (value === undefined) return ROLE_PERMISSIONS[role];
    if (!Array.isArray(value) || value.some(id => !MENU_IDS.includes(id))) {
        throw new HttpError(400, 'Menu permissions are invalid.');
    }
    return [...new Set(value)];
}

function toPublicUser(row) {
    return {
        id: row.id,
        username: row.username,
        name: row.name,
        nuptk: row.nuptk || '',
        role: row.role,
        permissions: Array.isArray(row.permissions) && row.permissions.length > 0
            ? row.permissions
            : ROLE_PERMISSIONS[row.role],
        permissionsLocked: Boolean(row.permissionsLocked),
        facultyId: row.facultyId,
        prodiId: row.prodiId,
        active: row.active,
        facultyName: row.facultyName,
        prodiName: row.prodiName
    };
}

async function runTransaction(pool, callback) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

async function validateTenantPair(db, facultyId, prodiId) {
    if (!facultyId || !prodiId) throw new HttpError(400, 'Faculty and study program are required.');
    const result = await db.query(
        'SELECT id FROM study_programs WHERE id = $1 AND faculty_id = $2',
        [prodiId, facultyId]
    );
    if (!result.rows[0]) throw new HttpError(400, 'Study program does not belong to the selected faculty.');
}

async function resolveProgramContext(db, user, requestedProdiId) {
    if (user.role !== 'administrator') {
        if (requestedProdiId && requestedProdiId !== user.prodiId) {
            const assignment = await db.query(
                `SELECT 1
                 FROM class_lecturers cl
                 JOIN academic_classes ac ON ac.id = cl.class_id
                 WHERE cl.lecturer_id = $1 AND ac.study_program_id = $2 AND ac.locked = TRUE
                 LIMIT 1`,
                [user.id, requestedProdiId]
            );
            if (!assignment.rows[0]) throw new HttpError(403, 'Cross-study-program access is not allowed.');
        }
        return requestedProdiId || user.prodiId;
    }

    if (requestedProdiId) {
        const requested = await db.query('SELECT id FROM study_programs WHERE id = $1', [requestedProdiId]);
        if (!requested.rows[0]) throw new HttpError(404, 'Study program not found.');
        return requestedProdiId;
    }
    const first = await db.query('SELECT id FROM study_programs WHERE active = TRUE ORDER BY name LIMIT 1');
    return first.rows[0] ? first.rows[0].id : null;
}

async function getMasterData(db, user) {
    if (user.role === 'administrator') {
        const [faculties, programs, years] = await Promise.all([
            db.query('SELECT id, code, name, active FROM faculties ORDER BY name'),
            db.query(`SELECT id, faculty_id AS "facultyId", code, name, active FROM study_programs ORDER BY name`),
            db.query('SELECT id, code, term, active FROM academic_years ORDER BY code DESC, term')
        ]);
        return { faculties: faculties.rows, studyPrograms: programs.rows, academicYears: years.rows };
    }

    const [faculties, programs, years] = await Promise.all([
        db.query(
            `SELECT DISTINCT f.id, f.code, f.name, f.active
             FROM faculties f
             JOIN study_programs sp ON sp.faculty_id = f.id
             WHERE sp.id = $1 OR sp.id IN (
                 SELECT ac.study_program_id FROM class_lecturers cl
                 JOIN academic_classes ac ON ac.id = cl.class_id
                 WHERE cl.lecturer_id = $2 AND ac.locked = TRUE
             )
             ORDER BY f.name`,
            [user.prodiId, user.id]
        ),
        db.query(
            `SELECT DISTINCT sp.id, sp.faculty_id AS "facultyId", sp.code, sp.name, sp.active
             FROM study_programs sp
             WHERE sp.id = $1 OR sp.id IN (
                 SELECT ac.study_program_id FROM class_lecturers cl
                 JOIN academic_classes ac ON ac.id = cl.class_id
                 WHERE cl.lecturer_id = $2 AND ac.locked = TRUE
             )
             ORDER BY sp.name`,
            [user.prodiId, user.id]
        ),
        db.query('SELECT id, code, term, active FROM academic_years ORDER BY code DESC, term')
    ]);
    return { faculties: faculties.rows, studyPrograms: programs.rows, academicYears: years.rows };
}

async function listAccounts(db) {
    const result = await db.query(
        `SELECT u.id, u.username, u.name, u.nuptk, u.role, u.permissions,
                u.permissions_locked AS "permissionsLocked", u.active,
                u.faculty_id AS "facultyId", u.study_program_id AS "prodiId",
                f.name AS "facultyName", sp.name AS "prodiName"
         FROM users u
         LEFT JOIN faculties f ON f.id = u.faculty_id
         LEFT JOIN study_programs sp ON sp.id = u.study_program_id
         ORDER BY u.name`
    );
    return result.rows.map(toPublicUser);
}

async function listLecturers(db, user, prodiId) {
    if (!prodiId) return [];
    const result = await db.query(
        `SELECT u.id, u.username, u.name, u.nuptk, u.role, u.permissions,
                u.permissions_locked AS "permissionsLocked", u.active,
                u.faculty_id AS "facultyId", u.study_program_id AS "prodiId",
                f.name AS "facultyName", sp.name AS "prodiName"
         FROM users u
         JOIN faculties f ON f.id = u.faculty_id
         JOIN study_programs sp ON sp.id = u.study_program_id
         WHERE u.active = TRUE
           AND u.role IN ('kaprodi', 'gkm', 'dosen')
         ORDER BY f.name, sp.name, u.name`
    );
    return result.rows.map(toPublicUser);
}

function validateProgramPayload(payload) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        throw new HttpError(400, 'Program state payload must be an object.');
    }
    if (payload.mkList !== undefined && !Array.isArray(payload.mkList)) {
        throw new HttpError(400, 'mkList must be an array.');
    }
    if (payload.classData !== undefined && (!payload.classData || typeof payload.classData !== 'object' || Array.isArray(payload.classData))) {
        throw new HttpError(400, 'classData must be an object.');
    }
    for (const cls of Object.values(payload.classData || {})) {
        const lecturerIds = Array.isArray(cls.lecturerIds) ? cls.lecturerIds : [];
        if (lecturerIds.length > 0 && !lecturerIds.includes(cls.pjmkLecturerId)) {
            throw new HttpError(400, 'Each class must have exactly one PJMK selected from its assigned lecturers.');
        }
    }
}

function filterProgramPayloadForUser(payload, user) {
    if (!payload || user.role !== 'dosen') return payload;
    const filtered = structuredClone(payload);
    filtered.classData = Object.fromEntries(
        Object.entries(payload.classData || {}).filter(([, cls]) =>
            cls.locked === true
            && Array.isArray(cls.lecturerIds)
            && cls.lecturerIds.includes(user.id)
        )
    );
    return filtered;
}

function mergeLecturerProgramPayload(currentPayload, submittedPayload, user) {
    if (!currentPayload) throw new HttpError(403, 'Program data must be initialized by Kaprodi or GKM.');
    const currentWithoutClasses = structuredClone(currentPayload);
    const submittedWithoutClasses = structuredClone(submittedPayload);
    delete currentWithoutClasses.classData;
    delete submittedWithoutClasses.classData;
    if (!isDeepStrictEqual(currentWithoutClasses, submittedWithoutClasses)) {
        throw new HttpError(403, 'Lecturers cannot modify curriculum or program-level data.');
    }

    const currentClasses = currentPayload.classData || {};
    const submittedClasses = submittedPayload.classData || {};
    const assignedKeys = new Set(
        Object.entries(currentClasses)
            .filter(([, cls]) => cls.locked === true && Array.isArray(cls.lecturerIds) && cls.lecturerIds.includes(user.id))
            .map(([key]) => key)
    );
    if (Object.keys(submittedClasses).some(key => !assignedKeys.has(key))) {
        throw new HttpError(403, 'Lecturers cannot submit classes they do not teach.');
    }

    const immutableFields = ['prodiId', 'academicYearId', 'mkId', 'kelas', 'semester', 'lecturerIds', 'pjmkLecturerId', 'locked'];
    const merged = structuredClone(currentPayload);
    for (const classKey of assignedKeys) {
        const submittedClass = submittedClasses[classKey];
        const currentClass = currentClasses[classKey];
        if (!submittedClass) {
            throw new HttpError(403, 'Lecturers cannot delete assigned classes.');
        }
        for (const field of immutableFields) {
            if (!isDeepStrictEqual(submittedClass[field], currentClass[field])) {
                throw new HttpError(403, `Lecturers cannot modify class field: ${field}.`);
            }
        }
        merged.classData[classKey] = submittedClass;
    }
    return merged;
}

function enforcePjmkRpsChanges(currentPayload, submittedPayload, user) {
    const currentClasses = currentPayload && currentPayload.classData ? currentPayload.classData : {};
    const submittedClasses = submittedPayload.classData || {};
    const rpsFields = ['rps', 'rpsFinalized', 'subCpmkList', 'subCpmkFinalized', 'komponenList', 'komponenFinalized'];
    for (const [classKey, submittedClass] of Object.entries(submittedClasses)) {
        const currentClass = currentClasses[classKey];
        const rpsChanged = currentClass && rpsFields.some(field =>
            !isDeepStrictEqual(currentClass[field], submittedClass[field])
        );
        if (!rpsChanged) continue;
        if (currentClass.pjmkLecturerId !== user.id) {
            throw new HttpError(403, 'Only the assigned PJMK lecturer can edit this class RPS.');
        }
    }
}

async function syncNormalizedProgramData(client, prodiId, payload) {
    const courses = Array.isArray(payload.mkList) ? payload.mkList : [];
    const classEntries = Object.entries(payload.classData || {});
    const lecturerIds = [...new Set(classEntries.flatMap(([, cls]) => Array.isArray(cls.lecturerIds) ? cls.lecturerIds : []))];

    if (lecturerIds.length > 0) {
        const lecturerPlaceholders = lecturerIds.map((_, index) => `$${index + 1}`).join(', ');
        const validLecturers = await client.query(
            `SELECT id FROM users
             WHERE active = TRUE AND role IN ('kaprodi', 'gkm', 'dosen')
               AND id IN (${lecturerPlaceholders})`,
            lecturerIds
        );
        if (validLecturers.rows.length !== lecturerIds.length) {
            throw new HttpError(400, 'One or more lecturers are inactive or invalid.');
        }
    }

    for (const [, cls] of classEntries) {
        if (cls.prodiId && cls.prodiId !== prodiId) {
            throw new HttpError(403, 'Class payload contains data from another study program.');
        }
    }

    await client.query('DELETE FROM courses WHERE study_program_id = $1', [prodiId]);
    const courseIds = new Map();
    for (const course of courses) {
        if (!course.id || !course.code || !course.name) continue;
        const result = await client.query(
            `INSERT INTO courses (study_program_id, source_key, code, name, semester, payload)
             VALUES ($1, $2, $3, $4, $5, $6::jsonb) RETURNING id`,
            [prodiId, String(course.id), String(course.code), String(course.name), String(course.semester || ''), JSON.stringify(course)]
        );
        courseIds.set(String(course.id), result.rows[0].id);
    }

    for (const [classKey, cls] of classEntries) {
        const courseId = courseIds.get(String(cls.mkId));
        if (!courseId) throw new HttpError(400, `Class ${classKey} references an unknown course.`);
        const classResult = await client.query(
            `INSERT INTO academic_classes
                (study_program_id, course_id, academic_year_id, source_key, name, semester, locked, rps_finalized, payload)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb) RETURNING id`,
            [
                prodiId,
                courseId,
                cls.academicYearId || null,
                classKey,
                String(cls.kelas || classKey),
                String(cls.semester || ''),
                Boolean(cls.locked),
                Boolean(cls.rpsFinalized),
                JSON.stringify(cls)
            ]
        );
        const classId = classResult.rows[0].id;

        for (const lecturerId of (cls.lecturerIds || [])) {
            await client.query(
                `INSERT INTO class_lecturers (class_id, lecturer_id, study_program_id) VALUES ($1, $2, $3)`,
                [classId, lecturerId, prodiId]
            );
        }

        const componentIds = new Map();
        for (const component of (cls.komponenList || [])) {
            if (!component.id) continue;
            const componentResult = await client.query(
                `INSERT INTO assessment_components
                    (class_id, study_program_id, source_key, name, component_type, payload)
                 VALUES ($1, $2, $3, $4, $5, $6::jsonb) RETURNING id`,
                [
                    classId,
                    prodiId,
                    String(component.id),
                    String(component.name || component.jenis || component.id),
                    String(component.jenis || ''),
                    JSON.stringify(component)
                ]
            );
            componentIds.set(String(component.id), componentResult.rows[0].id);
        }

        for (const student of (cls.students || [])) {
            if (!student.nim || !student.name) continue;
            const studentResult = await client.query(
                `INSERT INTO students (class_id, study_program_id, nim, name, payload)
                 VALUES ($1, $2, $3, $4, $5::jsonb) RETURNING id`,
                [classId, prodiId, String(student.nim), String(student.name), JSON.stringify(student)]
            );
            const studentId = studentResult.rows[0].id;
            for (const [componentKey, rawScore] of Object.entries(student.scores || {})) {
                const componentId = componentIds.get(componentKey);
                const score = Number(rawScore);
                if (!componentId || !Number.isFinite(score) || score < 0 || score > 100) continue;
                await client.query(
                    `INSERT INTO student_scores (student_id, component_id, class_id, score)
                     VALUES ($1, $2, $3, $4)`,
                    [studentId, componentId, classId, score]
                );
            }
            const attendance = cls.attendance && cls.attendance[student.nim] ? cls.attendance[student.nim] : {};
            for (const [meeting, status] of Object.entries(attendance)) {
                const meetingNumber = Number(meeting);
                if (!Number.isInteger(meetingNumber) || meetingNumber < 1 || meetingNumber > 32) continue;
                if (!['', 'hadir', 'izin', 'sakit', 'tidak hadir'].includes(status)) continue;
                await client.query(
                    `INSERT INTO attendance_records (student_id, class_id, meeting_number, status)
                     VALUES ($1, $2, $3, $4)`,
                    [studentId, classId, meetingNumber, status]
                );
            }
        }
    }
}

function createApp({ pool }) {
    const app = express();
    const authenticate = createAuthMiddleware(pool);

    app.use(helmet({ contentSecurityPolicy: false }));
    app.use(cors({ origin: true }));
    app.use(express.json({ limit: '15mb' }));

    app.get('/api/health', asyncRoute(async (_req, res) => {
        await pool.query('SELECT 1');
        res.json({ status: 'ok' });
    }));

    app.post('/api/auth/login', asyncRoute(async (req, res) => {
        const username = String(req.body.username || '').trim().toLowerCase();
        const password = String(req.body.password || '');
        if (!username || !password) throw new HttpError(400, 'Username and password are required.');
        const result = await pool.query(
            `SELECT id, username, password_hash, name, nuptk, role, permissions,
                    permissions_locked AS "permissionsLocked", active, auth_version AS "authVersion",
                    faculty_id AS "facultyId", study_program_id AS "prodiId"
             FROM users WHERE username = $1`,
            [username]
        );
        const user = result.rows[0];
        if (!user || !await bcrypt.compare(password, user.password_hash)) {
            throw new HttpError(401, 'Username or password is incorrect.');
        }
        if (!user.active) throw new HttpError(403, 'Account is inactive.');
        res.json({ token: signAccessToken(user), user: toPublicUser(user) });
    }));

    app.get('/api/auth/me', authenticate, (req, res) => res.json({ user: toPublicUser(req.user) }));

    app.post('/api/auth/change-password', authenticate, asyncRoute(async (req, res) => {
        const currentPassword = String(req.body.currentPassword || '');
        const newPassword = String(req.body.newPassword || '');
        if (!currentPassword) throw new HttpError(400, 'Current password is required.');
        if (newPassword.length < 8) throw new HttpError(400, 'New password must contain at least 8 characters.');

        const currentResult = await pool.query(
            'SELECT password_hash FROM users WHERE id = $1',
            [req.user.id]
        );
        if (!currentResult.rows[0] || !await bcrypt.compare(currentPassword, currentResult.rows[0].password_hash)) {
            throw new HttpError(401, 'Current password is incorrect.');
        }

        const passwordHash = await bcrypt.hash(newPassword, 12);
        const updated = await pool.query(
            `UPDATE users SET password_hash = $1, auth_version = auth_version + 1, updated_at = NOW()
             WHERE id = $2
             RETURNING auth_version AS "authVersion"`,
            [passwordHash, req.user.id]
        );
        res.json({
            token: signAccessToken({ ...req.user, authVersion: updated.rows[0].authVersion })
        });
    }));

    app.get('/api/bootstrap', authenticate, asyncRoute(async (req, res) => {
        const prodiId = await resolveProgramContext(pool, req.user, req.query.prodiId);
        const [masterData, stateResult, accounts, lecturers] = await Promise.all([
            getMasterData(pool, req.user),
            prodiId
                ? pool.query(`SELECT version, payload FROM program_states WHERE study_program_id = $1`, [prodiId])
                : Promise.resolve({ rows: [] }),
            req.user.role === 'administrator' ? listAccounts(pool) : Promise.resolve([]),
            listLecturers(pool, req.user, prodiId)
        ]);
        const stateRow = stateResult.rows[0];
        const visiblePayload = stateRow ? filterProgramPayloadForUser(stateRow.payload, req.user) : null;
        res.json({
            user: toPublicUser(req.user),
            contextProdiId: prodiId,
            masterData,
            accounts,
            lecturers,
            programState: { version: stateRow ? stateRow.version : 0, payload: visiblePayload }
        });
    }));

    app.get('/api/rps-templates', authenticate, asyncRoute(async (req, res) => {
        const courseCode = String(req.query.courseCode || '').trim().toLowerCase();
        if (!courseCode) throw new HttpError(400, 'Course code is required.');
        const [states, years] = await Promise.all([
            pool.query(
                `SELECT ps.study_program_id AS "prodiId", ps.payload, ps.updated_at AS "updatedAt",
                        sp.name AS "prodiName", f.name AS "facultyName"
                 FROM program_states ps
                 JOIN study_programs sp ON sp.id = ps.study_program_id
                 JOIN faculties f ON f.id = sp.faculty_id
                 ORDER BY ps.updated_at DESC`
            ),
            pool.query('SELECT id, code, term FROM academic_years')
        ]);
        const yearById = new Map(years.rows.map(year => [year.id, year]));
        const templates = [];
        for (const program of states.rows) {
            const courses = new Map((program.payload.mkList || []).map(course => [String(course.id), course]));
            for (const [classKey, cls] of Object.entries(program.payload.classData || {})) {
                const course = courses.get(String(cls.mkId));
                if (!course || String(course.code || '').trim().toLowerCase() !== courseCode) continue;
                if (!cls.rps || Object.keys(cls.rps).length === 0) continue;
                const year = yearById.get(cls.academicYearId);
                templates.push({
                    id: `${program.prodiId}:${classKey}`,
                    classKey,
                    className: cls.kelas || classKey,
                    courseCode: course.code,
                    courseName: course.name,
                    academicYear: year ? `${year.code} - ${year.term}` : 'Tahun akademik tidak diketahui',
                    facultyName: program.facultyName,
                    prodiName: program.prodiName,
                    updatedAt: program.updatedAt,
                    rps: cls.rps,
                    subCpmkList: cls.subCpmkList || [],
                    komponenList: cls.komponenList || []
                });
            }
        }
        res.json({ templates });
    }));

    app.get('/api/accounts', authenticate, requireAdministrator, asyncRoute(async (_req, res) => {
        res.json({ accounts: await listAccounts(pool) });
    }));

    app.post('/api/accounts', authenticate, requireAdministrator, asyncRoute(async (req, res) => {
        const username = String(req.body.username || '').trim().toLowerCase();
        const password = String(req.body.password || '');
        const name = String(req.body.name || '').trim();
        const nuptk = String(req.body.nuptk || '').trim() || null;
        const role = String(req.body.role || '');
        const permissions = normalizePermissions(req.body.permissions, role);
        const facultyId = role === 'administrator' ? null : req.body.facultyId;
        const prodiId = role === 'administrator' ? null : req.body.prodiId;
        if (!/^[a-z0-9._-]{3,80}$/.test(username)) throw new HttpError(400, 'Username format is invalid.');
        if (!name || password.length < 8) throw new HttpError(400, 'Name and a password of at least 8 characters are required.');
        if (!['administrator', 'kaprodi', 'gkm', 'dosen'].includes(role)) throw new HttpError(400, 'Role is invalid.');
        if (role !== 'administrator') await validateTenantPair(pool, facultyId, prodiId);
        const passwordHash = await bcrypt.hash(password, 12);
        const result = await pool.query(
            `INSERT INTO users (faculty_id, study_program_id, username, password_hash, name, nuptk, role, permissions)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
             RETURNING id, username, name, nuptk, role, permissions,
                       permissions_locked AS "permissionsLocked", active,
                       faculty_id AS "facultyId", study_program_id AS "prodiId"`,
            [facultyId, prodiId, username, passwordHash, name, nuptk, role, JSON.stringify(permissions)]
        );
        res.status(201).json({ account: toPublicUser(result.rows[0]) });
    }));

    app.patch('/api/accounts/:id', authenticate, requireAdministrator, asyncRoute(async (req, res) => {
        const existingResult = await pool.query(
            `SELECT id, username, name, nuptk, role, permissions,
                    permissions_locked AS "permissionsLocked", active,
                    faculty_id AS "facultyId", study_program_id AS "prodiId"
             FROM users WHERE id = $1`,
            [req.params.id]
        );
        const existing = existingResult.rows[0];
        if (!existing) throw new HttpError(404, 'Account not found.');
        const next = {
            username: req.body.username === undefined ? existing.username : String(req.body.username).trim().toLowerCase(),
            name: req.body.name === undefined ? existing.name : String(req.body.name).trim(),
            nuptk: req.body.nuptk === undefined ? existing.nuptk : (String(req.body.nuptk).trim() || null),
            role: req.body.role === undefined ? existing.role : String(req.body.role),
            permissions: req.body.permissions === undefined
                ? existing.permissions
                : normalizePermissions(req.body.permissions, req.body.role === undefined ? existing.role : String(req.body.role)),
            permissionsLocked: req.body.permissionsLocked === undefined
                ? existing.permissionsLocked
                : Boolean(req.body.permissionsLocked),
            active: req.body.active === undefined ? existing.active : Boolean(req.body.active),
            facultyId: req.body.facultyId === undefined ? existing.facultyId : req.body.facultyId,
            prodiId: req.body.prodiId === undefined ? existing.prodiId : req.body.prodiId
        };
        if (existing.id === req.user.id && (next.role !== existing.role || !next.active)) {
            throw new HttpError(400, 'The active account role/status cannot be changed.');
        }
        if (!/^[a-z0-9._-]{3,80}$/.test(next.username) || !next.name) throw new HttpError(400, 'Account data is invalid.');
        if (!['administrator', 'kaprodi', 'gkm', 'dosen'].includes(next.role)) throw new HttpError(400, 'Role is invalid.');
        if (existing.permissionsLocked
            && (req.body.permissions !== undefined || req.body.role !== undefined)
            && req.body.permissionsLocked !== false) {
            throw new HttpError(409, 'Unlock menu permissions before changing the role or access matrix.');
        }
        next.permissions = normalizePermissions(next.permissions, next.role);
        if (next.role === 'administrator') {
            next.facultyId = null;
            next.prodiId = null;
        } else {
            await validateTenantPair(pool, next.facultyId, next.prodiId);
        }
        if (existing.role === 'administrator' && existing.active && (next.role !== 'administrator' || !next.active)) {
            const remaining = await pool.query(
                `SELECT COUNT(*)::int AS count FROM users
                 WHERE role = 'administrator' AND active = TRUE AND id <> $1`,
                [existing.id]
            );
            if (remaining.rows[0].count === 0) throw new HttpError(409, 'At least one active Administrator must remain.');
        }
        const result = await pool.query(
            `UPDATE users SET username = $1, name = $2, nuptk = $3, role = $4,
                              permissions = $5::jsonb, permissions_locked = $6, active = $7,
                              faculty_id = $8, study_program_id = $9, updated_at = NOW()
             WHERE id = $10
             RETURNING id, username, name, nuptk, role, permissions,
                       permissions_locked AS "permissionsLocked", active,
                       faculty_id AS "facultyId", study_program_id AS "prodiId"`,
            [next.username, next.name, next.nuptk, next.role, JSON.stringify(next.permissions),
                next.permissionsLocked, next.active, next.facultyId, next.prodiId, existing.id]
        );
        res.json({ account: toPublicUser(result.rows[0]) });
    }));

    app.post('/api/accounts/:id/reset-password', authenticate, requireAdministrator, asyncRoute(async (req, res) => {
        const password = String(req.body.password || '');
        if (password.length < 8) throw new HttpError(400, 'Password must contain at least 8 characters.');
        const passwordHash = await bcrypt.hash(password, 12);
        const result = await pool.query(
            `UPDATE users SET password_hash = $1, auth_version = auth_version + 1, updated_at = NOW()
             WHERE id = $2 RETURNING id`,
            [passwordHash, req.params.id]
        );
        if (!result.rows[0]) throw new HttpError(404, 'Account not found.');
        res.status(204).end();
    }));

    app.delete('/api/accounts/:id', authenticate, requireAdministrator, asyncRoute(async (req, res) => {
        if (req.params.id === req.user.id) throw new HttpError(400, 'The active account cannot be deleted.');
        const target = await pool.query('SELECT role, active FROM users WHERE id = $1', [req.params.id]);
        if (!target.rows[0]) throw new HttpError(404, 'Account not found.');
        if (target.rows[0].role === 'administrator' && target.rows[0].active) {
            const remaining = await pool.query(
                `SELECT COUNT(*)::int AS count FROM users
                 WHERE role = 'administrator' AND active = TRUE AND id <> $1`,
                [req.params.id]
            );
            if (remaining.rows[0].count === 0) throw new HttpError(409, 'At least one active Administrator must remain.');
        }
        const assignments = await pool.query('SELECT COUNT(*)::int AS count FROM class_lecturers WHERE lecturer_id = $1', [req.params.id]);
        if (assignments.rows[0].count > 0) {
            throw new HttpError(409, 'Account is still assigned as a class lecturer. Remove the class assignments first.');
        }
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [req.params.id]);
        res.status(204).end();
    }));

    app.post('/api/master/faculties', authenticate, requireAdministrator, asyncRoute(async (req, res) => {
        const result = await pool.query(
            `INSERT INTO faculties (code, name) VALUES ($1, $2)
             RETURNING id, code, name, active`,
            [String(req.body.code || '').trim(), String(req.body.name || '').trim()]
        );
        res.status(201).json({ item: result.rows[0] });
    }));

    app.post('/api/master/study-programs', authenticate, requireAdministrator, asyncRoute(async (req, res) => {
        const result = await pool.query(
            `INSERT INTO study_programs (faculty_id, code, name) VALUES ($1, $2, $3)
             RETURNING id, faculty_id AS "facultyId", code, name, active`,
            [req.body.facultyId, String(req.body.code || '').trim(), String(req.body.name || '').trim()]
        );
        res.status(201).json({ item: result.rows[0] });
    }));

    app.post('/api/master/academic-years', authenticate, requireAdministrator, asyncRoute(async (req, res) => {
        const result = await pool.query(
            `INSERT INTO academic_years (code, term) VALUES ($1, $2)
             RETURNING id, code, term, active`,
            [String(req.body.code || '').trim(), req.body.term]
        );
        res.status(201).json({ item: result.rows[0] });
    }));

    const masterConfig = {
        faculties: { table: 'faculties', fields: ['code', 'name', 'active'] },
        'study-programs': { table: 'study_programs', fields: ['faculty_id', 'code', 'name', 'active'] },
        'academic-years': { table: 'academic_years', fields: ['code', 'term', 'active'] }
    };

    app.patch('/api/master/:type/:id', authenticate, requireAdministrator, asyncRoute(async (req, res) => {
        const config = masterConfig[req.params.type];
        if (!config) throw new HttpError(404, 'Master data type not found.');
        const fieldMap = { facultyId: 'faculty_id', prodiId: 'study_program_id' };
        const updates = [];
        const values = [];
        for (const [inputField, rawValue] of Object.entries(req.body)) {
            const column = fieldMap[inputField] || inputField;
            if (!config.fields.includes(column)) continue;
            values.push(typeof rawValue === 'string' ? rawValue.trim() : rawValue);
            updates.push(`${column} = $${values.length}`);
        }
        if (updates.length === 0) throw new HttpError(400, 'No valid fields supplied.');
        values.push(req.params.id);
        const result = await pool.query(
            `UPDATE ${config.table} SET ${updates.join(', ')}, updated_at = NOW()
             WHERE id = $${values.length} RETURNING *`,
            values
        );
        if (!result.rows[0]) throw new HttpError(404, 'Master data not found.');
        res.json({ item: result.rows[0] });
    }));

    app.delete('/api/master/:type/:id', authenticate, requireAdministrator, asyncRoute(async (req, res) => {
        const config = masterConfig[req.params.type];
        if (!config) throw new HttpError(404, 'Master data type not found.');
        const result = await pool.query(`DELETE FROM ${config.table} WHERE id = $1 RETURNING id`, [req.params.id]);
        if (!result.rows[0]) throw new HttpError(404, 'Master data not found.');
        res.status(204).end();
    }));

    app.put('/api/program-state', authenticate, asyncRoute(async (req, res) => {
        if (req.user.role === 'administrator') {
            throw new HttpError(403, 'Administrators have read-only access to academic data.');
        }
        const requestedProdiId = req.body.prodiId;
        const submittedPayload = req.body.payload;
        const expectedVersion = Number(req.body.version || 0);
        validateProgramPayload(submittedPayload);

        const result = await runTransaction(pool, async client => {
            const prodiId = await resolveProgramContext(client, req.user, requestedProdiId);
            if (!prodiId) throw new HttpError(400, 'No study program is available.');
            await client.query('SELECT id FROM study_programs WHERE id = $1 FOR UPDATE', [prodiId]);
            const current = await client.query(
                'SELECT version, payload FROM program_states WHERE study_program_id = $1 FOR UPDATE',
                [prodiId]
            );
            const currentVersion = current.rows[0] ? current.rows[0].version : 0;
            if (currentVersion !== expectedVersion) {
                throw new HttpError(409, 'Program state changed in another session. Reload before saving again.');
            }

            const effectivePayload = req.user.role === 'dosen'
                ? mergeLecturerProgramPayload(current.rows[0] && current.rows[0].payload, submittedPayload, req.user)
                : submittedPayload;
            enforcePjmkRpsChanges(current.rows[0] && current.rows[0].payload, effectivePayload, req.user);
            await syncNormalizedProgramData(client, prodiId, effectivePayload);
            const nextVersion = currentVersion + 1;
            await client.query(
                `INSERT INTO program_states (study_program_id, version, payload, updated_by)
                 VALUES ($1, $2, $3::jsonb, $4)
                 ON CONFLICT (study_program_id) DO UPDATE
                 SET version = EXCLUDED.version, payload = EXCLUDED.payload,
                     updated_by = EXCLUDED.updated_by, updated_at = NOW()`,
                [prodiId, nextVersion, JSON.stringify(effectivePayload), req.user.id]
            );
            return { prodiId, version: nextVersion };
        });
        res.json(result);
    }));

    const publicRoot = path.join(__dirname, '..');
    app.use('/assets', express.static(path.join(publicRoot, 'assets')));
    app.get('/LogoUSG01.png', (_req, res) => res.sendFile(path.join(publicRoot, 'LogoUSG01.png')));
    app.get('/LogoUSG02.png', (_req, res) => res.sendFile(path.join(publicRoot, 'LogoUSG02.png')));
    app.get('/', (_req, res) => res.sendFile(path.join(publicRoot, 'prototipe_OBE_08-08.html')));

    app.use((error, _req, res, _next) => {
        if (error instanceof HttpError) return res.status(error.status).json({ error: error.message });
        if (error.code === '23505') return res.status(409).json({ error: 'The record conflicts with existing data.' });
        if (error.code === '23503') return res.status(409).json({ error: 'The record is still referenced by other data.' });
        if (error.code === '23514' || error.code === '23502' || error.code === '22P02') {
            return res.status(400).json({ error: 'The submitted data is invalid.' });
        }
        console.error(error);
        res.status(500).json({ error: 'Internal server error.' });
    });

    return app;
}

module.exports = { createApp, HttpError, syncNormalizedProgramData };
