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
DROP TABLE IF EXISTS lecturer_availability;
DROP TABLE IF EXISTS admins;
DROP TABLE IF EXISTS admin_audit_log;
DROP TABLE IF EXISTS affected_records;
DROP TABLE IF EXISTS activity_log;
DROP TABLE IF EXISTS actions;
DROP INDEX IF EXISTS idx_polymorphic_lookup;
DROP INDEX IF EXISTS idx_user_history;
DROP INDEX IF EXISTS idx_admin_audit_log_admin;

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
  availability_id          INTEGER,
  duration_min             INTEGER NOT NULL DEFAULT 60 CHECK (duration_min > 0 AND duration_min <= 480),
  max_number_of_students   INTEGER NOT NULL DEFAULT 1 CHECK (max_number_of_students > 0),
  venue                    TEXT NOT NULL CHECK(length(venue) >= 3),
  status                   TEXT NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Booked', 'Ongoing', 'Missed', 'Cancelled', 'Rescheduled', 'RescheduledToNow')),
  allow_join               INTEGER NOT NULL DEFAULT 1 CHECK (allow_join IN (0, 1)),

  FOREIGN KEY (lecturer_id)     REFERENCES staff(staff_number) ON DELETE SET NULL,
  FOREIGN KEY (organiser)       REFERENCES students(student_number) ON DELETE SET NULL,
  FOREIGN KEY (availability_id) REFERENCES lecturer_availability(availability_id) ON DELETE SET NULL
);

CREATE TABLE consultation_attendees (
  const_id       TEXT,
  student_number INTEGER,

  PRIMARY KEY (const_id, student_number),

  FOREIGN KEY (const_id)       REFERENCES consultations(const_id) ON DELETE CASCADE,
  FOREIGN KEY (student_number) REFERENCES students(student_number) ON DELETE CASCADE
);

CREATE TABLE lecturer_availability (
  availability_id INTEGER PRIMARY KEY,
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

CREATE TABLE admins (
  admin_id  TEXT PRIMARY KEY,
  name      TEXT NOT NULL,
  email     TEXT UNIQUE NOT NULL,
  password  TEXT NOT NULL
);

CREATE TABLE admin_audit_log (
  audit_id   INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id   TEXT NOT NULL,
  action     TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  table_name TEXT NOT NULL,
  row_id     TEXT NOT NULL,
  old_data   TEXT,
  new_data   TEXT,
  timestamp  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin
  ON admin_audit_log(admin_id);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_table_row
  ON admin_audit_log(table_name, row_id);

CREATE TABLE actions (
    action_id INT PRIMARY KEY,
    action_name VARCHAR(100) NOT NULL,
    page_context VARCHAR(100) NOT NULL,
    description VARCHAR(255) NOT NULL
);

CREATE TABLE activity_log (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    action_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT log_action
        FOREIGN KEY (action_id)
        REFERENCES actions(action_id)
);

CREATE TABLE affected_records (
    log_id INT NOT NULL,
    table_affected VARCHAR(100) NOT NULL,
    record_id VARCHAR(50) NOT NULL,

    PRIMARY KEY (log_id, table_affected, record_id),

    CONSTRAINT affected_log
        FOREIGN KEY (log_id)
        REFERENCES activity_log(log_id)
        ON DELETE CASCADE
);

CREATE INDEX idx_polymorphic_lookup
    ON affected_records(table_affected, record_id);

CREATE INDEX idx_user_history
    ON activity_log(user_id);
