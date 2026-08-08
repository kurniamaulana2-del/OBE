ALTER TABLE class_lecturers
    DROP CONSTRAINT IF EXISTS class_lecturers_lecturer_id_study_program_id_fkey;

ALTER TABLE class_lecturers
    DROP CONSTRAINT IF EXISTS class_lecturers_lecturer_id_fkey;

ALTER TABLE class_lecturers
    ADD CONSTRAINT class_lecturers_lecturer_id_fkey
    FOREIGN KEY (lecturer_id) REFERENCES users(id) ON DELETE RESTRICT;
