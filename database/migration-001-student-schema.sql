-- database: database.db
-- Migration 001: create degrees, students, courses, enrollments tables (ADR-005)

-- Foreign key enforcement must be off while dropping tables that reference each other.
PRAGMA foreign_keys = OFF;

DROP TABLE IF EXISTS enrollments;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS degrees;
DROP TABLE IF EXISTS staff;
DROP TABLE IF EXISTS consultations;
DROP TABLE IF EXISTS consultation_attendees;

PRAGMA foreign_keys = ON;

CREATE TABLE degrees (
  degree_code  TEXT PRIMARY KEY,
  degree_name  TEXT NOT NULL UNIQUE
);

CREATE TABLE students (
  student_number  INTEGER PRIMARY KEY,
  name            TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE,
  password        TEXT NOT NULL,
  degree_code     TEXT NOT NULL REFERENCES degrees(degree_code)
);

CREATE TABLE courses (
  course_code  TEXT PRIMARY KEY,
  course_name  TEXT NOT NULL,
  year_level   INTEGER NOT NULL,
  degree_code  TEXT NOT NULL REFERENCES degrees(degree_code)
);

CREATE TABLE enrollments (
  student_number  INTEGER NOT NULL,
  course_code     TEXT NOT NULL,
  PRIMARY KEY (student_number, course_code),
  FOREIGN KEY (student_number) REFERENCES students(student_number) ON DELETE CASCADE,
  FOREIGN KEY (course_code)    REFERENCES courses(course_code)    ON DELETE CASCADE
);

CREATE TABLE consultations (
    const_id TEXT PRIMARY KEY,
    consultation_title TEXT NOT NULL CHECK(length(consultation_title) BETWEEN 5 AND 100) DEFAULT 'Consultation Available',
    consultation_description TEXT  CHECK(length(consultation_description) <= 500),
    consultation_date TEXT NOT NULL CHECK (consultation_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
    consultation_time TEXT NOT NULL CHECK (consultation_time GLOB '[0-9][0-9]:[0-9][0-9]'),
    lecturer_id text,
    organiser integer, --FOREIGN KEY REFERENCES student(student_number),
    --attendees integer[] NOT NULL FOREIGN KEY REFERENCES student(student_number),  -- Array of student numbers attending the consultation
    duration_min INTEGER NOT NULL DEFAULT 60 CHECK (duration_min > 0 AND duration_min <= 480), -- Duration in minutes, must be positive and reasonable
    max_number_of_students INTEGER NOT NULL DEFAULT 1 CHECK (max_number_of_students > 0 ),
    venue TEXT NOT NULL CHECK(length(venue) >= 3), -- if online a link must be provided
    status TEXT NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Booked', 'Ongoing', 'Missed', 'Cancelled', 'Rescheduled', 'RescheduledToNow')),
    --review_for_lecturer text(max_characters(300)),
	--review_for_students  text(max_characters(300))[],
	--reports_flags text[]  -- Array of flags/reports for the consultation

    FOREIGN KEY (lecturer_id) REFERENCES staff(staff_number) ON DELETE SET NULL,
    FOREIGN KEY (organiser) REFERENCES students(student_number) ON DELETE SET NULL
    --FOREIGN KEY (attendees) REFERENCES student(student_number) ON DELETE SET NULL
);

CREATE TABLE consultation_attendees (
    const_id TEXT,
    student_number INTEGER,
    
    PRIMARY KEY (const_id, student_number),

    FOREIGN KEY (const_id) REFERENCES consultations(const_id) ON DELETE CASCADE,
    FOREIGN KEY (student_number) REFERENCES students(student_number) ON DELETE CASCADE
);

CREATE TABLE staff (
    staff_number TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    department TEXT,
    password TEXT,
    courses TEXT[] NOT NULL
);