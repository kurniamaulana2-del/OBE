CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS faculties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS study_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id UUID NOT NULL REFERENCES faculties(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    code VARCHAR(30) NOT NULL,
    name VARCHAR(200) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (faculty_id, code),
    UNIQUE (id, faculty_id)
);

CREATE TABLE IF NOT EXISTS academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL,
    term VARCHAR(20) NOT NULL CHECK (term IN ('Ganjil', 'Genap', 'Pendek')),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (code, term)
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id UUID,
    study_program_id UUID,
    username VARCHAR(80) NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
    name VARCHAR(200) NOT NULL,
    nuptk VARCHAR(30),
    role VARCHAR(20) NOT NULL CHECK (role IN ('administrator', 'kaprodi', 'gkm', 'dosen')),
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    permissions_locked BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    auth_version INTEGER NOT NULL DEFAULT 1 CHECK (auth_version > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (
        (role = 'administrator' AND faculty_id IS NULL AND study_program_id IS NULL)
        OR
        (role <> 'administrator' AND faculty_id IS NOT NULL AND study_program_id IS NOT NULL)
    ),
    FOREIGN KEY (study_program_id, faculty_id)
        REFERENCES study_programs(id, faculty_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    UNIQUE (id, study_program_id)
);

CREATE TABLE IF NOT EXISTS program_states (
    study_program_id UUID PRIMARY KEY REFERENCES study_programs(id) ON DELETE CASCADE,
    version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    study_program_id UUID NOT NULL REFERENCES study_programs(id) ON DELETE CASCADE,
    source_key VARCHAR(120) NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(240) NOT NULL,
    semester VARCHAR(10),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    UNIQUE (study_program_id, source_key),
    UNIQUE (id, study_program_id)
);

CREATE TABLE IF NOT EXISTS academic_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    study_program_id UUID NOT NULL,
    course_id UUID NOT NULL,
    academic_year_id UUID,
    source_key VARCHAR(180) NOT NULL,
    name VARCHAR(160) NOT NULL,
    semester VARCHAR(10),
    locked BOOLEAN NOT NULL DEFAULT FALSE,
    rps_finalized BOOLEAN NOT NULL DEFAULT FALSE,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    FOREIGN KEY (course_id, study_program_id)
        REFERENCES courses(id, study_program_id) ON DELETE CASCADE,
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE RESTRICT,
    UNIQUE (study_program_id, source_key),
    UNIQUE (id, study_program_id)
);

CREATE TABLE IF NOT EXISTS class_lecturers (
    class_id UUID NOT NULL,
    lecturer_id UUID NOT NULL,
    study_program_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (class_id, lecturer_id),
    FOREIGN KEY (class_id, study_program_id)
        REFERENCES academic_classes(id, study_program_id) ON DELETE CASCADE,
    FOREIGN KEY (lecturer_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL,
    study_program_id UUID NOT NULL,
    nim VARCHAR(80) NOT NULL,
    name VARCHAR(200) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    FOREIGN KEY (class_id, study_program_id)
        REFERENCES academic_classes(id, study_program_id) ON DELETE CASCADE,
    UNIQUE (class_id, nim),
    UNIQUE (id, class_id)
);

CREATE TABLE IF NOT EXISTS assessment_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL,
    study_program_id UUID NOT NULL,
    source_key VARCHAR(160) NOT NULL,
    name VARCHAR(240) NOT NULL,
    component_type VARCHAR(80),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    FOREIGN KEY (class_id, study_program_id)
        REFERENCES academic_classes(id, study_program_id) ON DELETE CASCADE,
    UNIQUE (class_id, source_key),
    UNIQUE (id, class_id)
);

CREATE TABLE IF NOT EXISTS student_scores (
    student_id UUID NOT NULL,
    component_id UUID NOT NULL,
    class_id UUID NOT NULL,
    score NUMERIC(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (student_id, component_id),
    FOREIGN KEY (student_id, class_id) REFERENCES students(id, class_id) ON DELETE CASCADE,
    FOREIGN KEY (component_id, class_id) REFERENCES assessment_components(id, class_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS attendance_records (
    student_id UUID NOT NULL,
    class_id UUID NOT NULL,
    meeting_number SMALLINT NOT NULL CHECK (meeting_number BETWEEN 1 AND 32),
    status VARCHAR(20) NOT NULL CHECK (status IN ('', 'hadir', 'izin', 'sakit', 'tidak hadir')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (student_id, meeting_number),
    FOREIGN KEY (student_id, class_id) REFERENCES students(id, class_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(faculty_id, study_program_id);
CREATE INDEX IF NOT EXISTS idx_classes_program ON academic_classes(study_program_id);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_scores_class ON student_scores(class_id);
