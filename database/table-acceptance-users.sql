-- database: database.db
-- SQLite acceptance criteria for users table

-- 1. View all users (should be empty initially)
SELECT * FROM users;

-- 2. Insert a valid test student
INSERT INTO users (student_staff_number, name, email, password, role)
VALUES (12345678, 'Test Student', 'test@students.wits.ac.za', 'hashed_pw', 'student');

-- 3. Confirm the insert worked
SELECT * FROM users WHERE student_staff_number = 12345678;

-- 4. PRAGMA: confirm column types, NOT NULL constraints, and primary key
PRAGMA table_info(users);
-- Expected: student_staff_number has pk=1, email and name have notnull=1

-- 5. PRAGMA: confirm indexes exist for PK and UNIQUE constraints
PRAGMA index_list(users);

-- 6. Confirm email uniqueness is enforced
-- This insert SHOULD fail with a UNIQUE constraint violation:
INSERT INTO users (student_staff_number, name, email, password, role)
VALUES (99999999, 'Duplicate Email', 'test@students.wits.ac.za', 'hashed_pw', 'student');

-- 7. Confirm student_staff_number uniqueness is enforced
-- This insert SHOULD also fail:
INSERT INTO users (student_staff_number, name, email, password, role)
VALUES (12345678, 'Duplicate Number', 'other@students.wits.ac.za', 'hashed_pw', 'student');

-- 8. Clean up test data
DELETE FROM users WHERE student_staff_number = 12345678;