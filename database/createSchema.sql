-- database: database.db
-- Schema v2: ADR-004 tables extended with departments and staff_courses (ADR-006)

-- Foreign key enforcement must be off while dropping tables that reference each other.
PRAGMA foreign_keys = OFF;

DROP TABLE IF EXISTS staff_courses;
DROP TABLE IF EXISTS consultation_attendees;
DROP TABLE IF EXISTS enrollments;
DROP TABLE IF EXISTS consultations;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS staff;
DROP TABLE IF EXISTS degrees;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS lecturer_availablity;

PRAGMA foreign_keys = ON;

CREATE TABLE departments (
  dept_code    TEXT PRIMARY KEY,
  dept_name    TEXT NOT NULL,
  faculty_name TEXT NOT NULL
);

CREATE TABLE degrees (
  degree_code  TEXT PRIMARY KEY,
  degree_name  TEXT NOT NULL UNIQUE,
  dept_code    TEXT NOT NULL REFERENCES departments(dept_code)
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
  dept_code    TEXT NOT NULL REFERENCES departments(dept_code)
);

CREATE TABLE enrollments (
  student_number  INTEGER NOT NULL,
  course_code     TEXT NOT NULL,
  PRIMARY KEY (student_number, course_code),
  FOREIGN KEY (student_number) REFERENCES students(student_number) ON DELETE CASCADE,
  FOREIGN KEY (course_code)    REFERENCES courses(course_code)    ON DELETE CASCADE
);

CREATE TABLE staff (
  staff_number TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  email        TEXT UNIQUE NOT NULL,
  department   TEXT,
  dept_code    TEXT REFERENCES departments(dept_code),
  password     TEXT
);

CREATE TABLE staff_courses (
  staff_number TEXT NOT NULL,
  course_code  TEXT NOT NULL,
  PRIMARY KEY (staff_number, course_code),
  FOREIGN KEY (staff_number) REFERENCES staff(staff_number) ON DELETE CASCADE,
  FOREIGN KEY (course_code)  REFERENCES courses(course_code) ON DELETE CASCADE
);

CREATE TABLE consultations (
  const_id                 TEXT PRIMARY KEY,
  consultation_title       TEXT NOT NULL CHECK(length(consultation_title) BETWEEN 5 AND 100) DEFAULT 'Consultation Available',
  consultation_description TEXT CHECK(length(consultation_description) <= 500),
  consultation_date        TEXT NOT NULL CHECK (consultation_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  consultation_time        TEXT NOT NULL CHECK (consultation_time GLOB '[0-9][0-9]:[0-9][0-9]'),
  lecturer_id              TEXT,
  organiser                INTEGER,
  duration_min             INTEGER NOT NULL DEFAULT 60 CHECK (duration_min > 0 AND duration_min <= 480),
  max_number_of_students   INTEGER NOT NULL DEFAULT 1 CHECK (max_number_of_students > 0),
  venue                    TEXT NOT NULL CHECK(length(venue) >= 3),
  status                   TEXT NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Booked', 'Ongoing', 'Missed', 'Cancelled', 'Rescheduled', 'RescheduledToNow')),

  FOREIGN KEY (lecturer_id) REFERENCES staff(staff_number) ON DELETE SET NULL,
  FOREIGN KEY (organiser)   REFERENCES students(student_number) ON DELETE SET NULL
);

CREATE TABLE consultation_attendees (
  const_id       TEXT,
  student_number INTEGER,

  PRIMARY KEY (const_id, student_number),

  FOREIGN KEY (const_id)       REFERENCES consultations(const_id) ON DELETE CASCADE,
  FOREIGN KEY (student_number) REFERENCES students(student_number) ON DELETE CASCADE
);

CREATE TABLE lecturer_availablity (
  availability_id TEXT PRIMARY KEY,
  staff_number TEXT NOT NULL,
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Mon','Tue','Wed','Thu','Fri')),
  
  start_time TEXT NOT NULL CHECK (start_time GLOB '[0-9][0-9]:[0-9][0-9]'),
  end_time   TEXT NOT NULL CHECK (end_time   GLOB '[0-9][0-9]:[0-9][0-9]'),
  
  max_booking_min INTEGER NOT NULL DEFAULT 60 
    CHECK (max_booking_min > 0 AND max_booking_min <= 480),

  max_number_of_students INTEGER NOT NULL DEFAULT 1 
    CHECK (max_number_of_students > 0),

  venue TEXT NOT NULL CHECK(length(venue) >= 3),

  CHECK (end_time > start_time),

  FOREIGN KEY (staff_number) REFERENCES staff(staff_number) ON DELETE CASCADE
);