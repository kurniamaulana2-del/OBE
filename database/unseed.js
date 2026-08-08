const { pool } = require('../server/db');
const seedState = require('./seed-state');

const SEEDED_USERNAMES = seedState.accounts.map(account => account.username);
const SEEDED_FACULTY_CODE = seedState.masterData.faculties[0].code;
const SEEDED_PROGRAM_CODE = seedState.masterData.studyPrograms[0].code;
const SEEDED_ACADEMIC_YEAR = seedState.masterData.academicYears[0];

async function unseed(client) {
    await client.query('BEGIN');
    try {
        const usernamePlaceholders = SEEDED_USERNAMES.map((_, index) => `$${index + 1}`).join(', ');
        const programResult = await client.query(
            `SELECT sp.id, sp.faculty_id AS "facultyId"
             FROM study_programs sp
             JOIN faculties f ON f.id = sp.faculty_id
             WHERE f.code = $1 AND sp.code = $2
             FOR UPDATE`,
            [SEEDED_FACULTY_CODE, SEEDED_PROGRAM_CODE]
        );
        const program = programResult.rows[0] || null;

        const externalAssignments = await client.query(
            `SELECT DISTINCT u.username
             FROM class_lecturers cl
             JOIN users u ON u.id = cl.lecturer_id
             JOIN academic_classes ac ON ac.id = cl.class_id
             WHERE u.username IN (${usernamePlaceholders})
               AND ($${SEEDED_USERNAMES.length + 1}::uuid IS NULL
                    OR ac.study_program_id <> $${SEEDED_USERNAMES.length + 1})
             ORDER BY u.username`,
            [...SEEDED_USERNAMES, program ? program.id : null]
        );
        if (externalAssignments.rows.length > 0) {
            const usernames = externalAssignments.rows.map(row => row.username).join(', ');
            throw new Error(`Unseed dibatalkan: akun demo masih digunakan pada kelas di program studi lain (${usernames}).`);
        }

        if (program) {
            await client.query(
                'DELETE FROM class_lecturers WHERE study_program_id = $1',
                [program.id]
            );
        }

        const usersResult = await client.query(
            `DELETE FROM users WHERE username IN (${usernamePlaceholders})`,
            SEEDED_USERNAMES
        );
        let deletedPrograms = 0;
        if (program) {
            const result = await client.query('DELETE FROM study_programs WHERE id = $1', [program.id]);
            deletedPrograms = result.rowCount;
        }
        const yearsResult = await client.query(
            `DELETE FROM academic_years
             WHERE code = $1
               AND term = $2
               AND id NOT IN (
                   SELECT academic_year_id
                   FROM academic_classes
                   WHERE academic_year_id IS NOT NULL
               )`,
            [SEEDED_ACADEMIC_YEAR.code, SEEDED_ACADEMIC_YEAR.term]
        );
        const facultiesResult = await client.query(
            `DELETE FROM faculties
             WHERE code = $1
               AND id NOT IN (
                   SELECT faculty_id
                   FROM study_programs
               )`,
            [SEEDED_FACULTY_CODE]
        );

        await client.query('COMMIT');
        return {
            users: usersResult.rowCount,
            studyPrograms: deletedPrograms,
            faculties: facultiesResult.rowCount,
            academicYears: yearsResult.rowCount
        };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
}

async function main() {
    const client = await pool.connect();
    try {
        const deleted = await unseed(client);
        console.log('Demo data removed:', deleted);
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

module.exports = {
    SEEDED_ACADEMIC_YEAR,
    SEEDED_FACULTY_CODE,
    SEEDED_PROGRAM_CODE,
    SEEDED_USERNAMES,
    unseed
};
