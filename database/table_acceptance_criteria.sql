-- SQLite

SELECT * FROM staff;

--ALTER TABLE staff ADD COLUMN courses JSON;

UPDATE staff 
SET courses = '["ELEN4010", "ELEN2020", "ELEN3009"]' 
WHERE staff_number = 'A000356';

SELECT * FROM staff
WHERE staff_number = 'A000356';

PRAGMA table_info(staff);
-- Shows pk = 1 for staff_number, which is the primary key of the table.

PRAGMA index_list(staff);
PRAGMA index_info('sqlite_autoindex_staff_1');
PRAGMA index_info('sqlite_autoindex_staff_2');
-- Confirms email and staff number is unique


SELECT * FROM consultations;

PRAGMA table_info(consultations);

PRAGMA index_list(consultations);
PRAGMA index_info('sqlite_autoindex_consultations_1');