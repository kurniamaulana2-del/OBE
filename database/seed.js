const bcrypt = require('bcryptjs');
const { pool } = require('../server/db');
const { syncNormalizedProgramData } = require('../server/app');
const seedState = require('./seed-state');

const SEEDED_PASSWORDS = {
    admin: 'Admin123!',
    kaprodi: 'Kaprodi123!',
    gkm: 'Gkm123!',
    dosen: 'Dosen123!'
};

function getSeedMasterData() {
    const faculty = seedState.masterData.faculties[0];
    const program = seedState.masterData.studyPrograms[0];
    const academicYear = seedState.masterData.academicYears[0];
    if (!faculty || !program || !academicYear) {
        throw new Error('Seed state must define at least one faculty, study program, and academic year.');
    }
    return { faculty, program, academicYear };
}

async function upsertUser(client, account, facultyId, prodiId) {
    const password = SEEDED_PASSWORDS[account.username];
    if (!password) throw new Error(`No seed password is configured for ${account.username}.`);
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await client.query(
        `INSERT INTO users (faculty_id, study_program_id, username, password_hash, name, nuptk, role, active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
         ON CONFLICT (username) DO UPDATE SET
             faculty_id = EXCLUDED.faculty_id,
             study_program_id = EXCLUDED.study_program_id,
             password_hash = EXCLUDED.password_hash,
             name = EXCLUDED.name,
             nuptk = EXCLUDED.nuptk,
             role = EXCLUDED.role,
             active = TRUE,
             updated_at = NOW()
         RETURNING id`,
        [facultyId, prodiId, account.username, passwordHash, account.name, account.nuptk || null, account.role]
    );
    return result.rows[0].id;
}

function buildSeedProgramPayload({ prodiId, academicYearId, userIds }) {
    const payload = structuredClone(seedState);
    delete payload.accounts;
    delete payload.masterData;
    delete payload.activeMainMenu;
    delete payload.activeSubMenu;
    delete payload.selectedClassKey;
    delete payload.selectedMKId;
    delete payload.tempStudentList;

    for (const [classKey, cls] of Object.entries(payload.classData || {})) {
        cls.prodiId = prodiId;
        cls.academicYearId = academicYearId;
        cls.lecturerIds = (cls.lecturerIds || []).map(legacyId => {
            const userId = userIds.get(legacyId);
            if (!userId) throw new Error(`Class ${classKey} references unknown lecturer ${legacyId}.`);
            return userId;
        });
        if (cls.pjmkLecturerId) {
            const pjmkId = userIds.get(cls.pjmkLecturerId);
            if (!pjmkId) throw new Error(`Class ${classKey} references unknown PJMK ${cls.pjmkLecturerId}.`);
            cls.pjmkLecturerId = pjmkId;
        }
    }
    return payload;
}

async function seed(client) {
    await client.query('BEGIN');
    try {
        const { faculty, program, academicYear } = getSeedMasterData();
        const facultyResult = await client.query(
            `INSERT INTO faculties (code, name, active) VALUES ($1, $2, TRUE)
             ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, active = TRUE, updated_at = NOW()
             RETURNING id`,
            [faculty.code, faculty.name]
        );
        const facultyId = facultyResult.rows[0].id;
        const programResult = await client.query(
            `INSERT INTO study_programs (faculty_id, code, name, active)
             VALUES ($1, $2, $3, TRUE)
             ON CONFLICT (faculty_id, code) DO UPDATE
             SET name = EXCLUDED.name, active = TRUE, updated_at = NOW()
             RETURNING id`,
            [facultyId, program.code, program.name]
        );
        const prodiId = programResult.rows[0].id;
        const yearResult = await client.query(
            `INSERT INTO academic_years (code, term, active) VALUES ($1, $2, TRUE)
             ON CONFLICT (code, term) DO UPDATE SET active = TRUE, updated_at = NOW()
             RETURNING id`,
            [academicYear.code, academicYear.term]
        );
        const academicYearId = yearResult.rows[0].id;

        const userIds = new Map();
        for (const account of seedState.accounts) {
            const isAdministrator = account.role === 'administrator';
            const userId = await upsertUser(
                client,
                account,
                isAdministrator ? null : facultyId,
                isAdministrator ? null : prodiId
            );
            userIds.set(account.id, userId);
        }

        const payload = buildSeedProgramPayload({ prodiId, academicYearId, userIds });
        await syncNormalizedProgramData(client, prodiId, payload);
        const updatedBy = userIds.get(
            seedState.accounts.find(account => account.role === 'kaprodi')?.id
        ) || null;
        await client.query(
            `INSERT INTO program_states (study_program_id, version, payload, updated_by)
             VALUES ($1, 1, $2::jsonb, $3)
             ON CONFLICT (study_program_id) DO UPDATE
             SET version = 1, payload = EXCLUDED.payload,
                 updated_by = EXCLUDED.updated_by, updated_at = NOW()`,
            [prodiId, JSON.stringify(payload), updatedBy]
        );

        await client.query('COMMIT');
        return {
            facultyId,
            prodiId,
            academicYearId,
            users: userIds.size,
            courses: payload.mkList.length,
            classes: Object.keys(payload.classData).length
        };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
}

async function main() {
    const client = await pool.connect();
    try {
        const result = await seed(client);
        console.log('Demo master data, accounts, and program state seeded:', result);
    } finally {
        client.release();
    }
}

if (require.main === module) {
    main()
        .catch(error => {
            console.error(error);
            process.exitCode = 1;
        })
        .finally(() => pool.end());
}

module.exports = { SEEDED_PASSWORDS, buildSeedProgramPayload, getSeedMasterData, seed };
