-- Acceptance checks for the student schema (degrees, students, courses, enrollments)
-- Run migration-001 and seed-001 first.

-- 1. All four tables should exist and be empty (before seeding)
SELECT * FROM degrees;
SELECT * FROM students;
SELECT * FROM courses;
SELECT * FROM enrollments;

-- 2. Schema inspection
PRAGMA table_info(degrees);
PRAGMA table_info(students);
PRAGMA table_info(courses);
PRAGMA table_info(enrollments);

-- 3. Insert a valid student referencing a seeded degree
INSERT INTO students (student_number, name, email, password, degree_code)
VALUES (1234567, 'Test Student', 'test@students.wits.ac.za', 'hashed_pw', 'BSCENGINFO');

SELECT * FROM students WHERE student_number = 1234567;

-- 4. Enroll the student in two courses from different year levels
INSERT INTO enrollments (student_number, course_code) VALUES (1234567, 'ELEN3009');
INSERT INTO enrollments (student_number, course_code) VALUES (1234567, 'ELEN4010');

-- Derive the year levels the student spans via join
SELECT c.year_level
FROM enrollments e
JOIN courses c ON e.course_code = c.course_code
WHERE e.student_number = 1234567
ORDER BY c.year_level;

-- 5. Constraint violations

-- Duplicate email -- SHOULD fail
INSERT INTO students (student_number, name, email, password, degree_code)
VALUES (9999999, 'Duplicate Email', 'test@students.wits.ac.za', 'hashed_pw', 'BSCENGINFO');

-- Duplicate student_number -- SHOULD fail
INSERT INTO students (student_number, name, email, password, degree_code)
VALUES (1234567, 'Duplicate Number', 'other@students.wits.ac.za', 'hashed_pw', 'BSCENGINFO');

-- Enrollment referencing nonexistent student -- SHOULD fail
INSERT INTO enrollments (student_number, course_code)
VALUES (9999998, 'ELEN3009');

-- 6. Clean up
DELETE FROM enrollments WHERE student_number = 1234567;
DELETE FROM students WHERE student_number = 1234567;
