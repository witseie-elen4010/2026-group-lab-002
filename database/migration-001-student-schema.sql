-- Migration 001: create degrees, students, courses, enrollments tables (ADR-005)

-- Foreign key enforcement must be off while dropping tables that reference each other.
PRAGMA foreign_keys = OFF;

DROP TABLE IF EXISTS enrollments;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS degrees;
DROP TABLE IF EXISTS users;

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
