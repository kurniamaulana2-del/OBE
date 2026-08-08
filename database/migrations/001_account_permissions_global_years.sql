ALTER TABLE users ADD COLUMN IF NOT EXISTS nuptk VARCHAR(30);
ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions_locked BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE users SET nuptk = '3456789012345678' WHERE username = 'kaprodi' AND nuptk IS NULL;
UPDATE users SET nuptk = '4567890123456789' WHERE username = 'gkm' AND nuptk IS NULL;
UPDATE users SET nuptk = '1234567890123456' WHERE username = 'dosen' AND nuptk IS NULL;

ALTER TABLE academic_classes DROP CONSTRAINT IF EXISTS academic_classes_academic_year_id_study_program_id_fkey;
ALTER TABLE academic_years DROP CONSTRAINT IF EXISTS academic_years_study_program_id_faculty_id_fkey;
ALTER TABLE academic_years DROP CONSTRAINT IF EXISTS academic_years_study_program_id_code_term_key;
ALTER TABLE academic_years DROP CONSTRAINT IF EXISTS academic_years_id_study_program_id_key;
ALTER TABLE academic_years ALTER COLUMN faculty_id DROP NOT NULL;
ALTER TABLE academic_years ALTER COLUMN study_program_id DROP NOT NULL;

UPDATE academic_years canonical
SET faculty_id = NULL, study_program_id = NULL
WHERE canonical.id IN (
    SELECT MIN(id::text)::uuid
    FROM academic_years
    GROUP BY code, term
);

UPDATE academic_classes cls
SET academic_year_id = canonical.id
FROM academic_years existing
JOIN academic_years canonical
  ON canonical.code = existing.code
 AND canonical.term = existing.term
 AND canonical.faculty_id IS NULL
 AND canonical.study_program_id IS NULL
WHERE cls.academic_year_id = existing.id;

DELETE FROM academic_years
WHERE faculty_id IS NOT NULL OR study_program_id IS NOT NULL;

ALTER TABLE academic_years ADD CONSTRAINT academic_years_code_term_key UNIQUE (code, term);
ALTER TABLE academic_classes
    ADD CONSTRAINT academic_classes_academic_year_id_fkey
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE RESTRICT;
