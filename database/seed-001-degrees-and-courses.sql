-- Seed 001: degrees and course catalog for initial app launch

INSERT OR IGNORE INTO degrees (degree_code, degree_name) VALUES
  ('BSCENGINFO', 'BSc Eng (Information)'),
  ('BSCENGELEC', 'BSc Eng (Electrical)');

INSERT OR IGNORE INTO courses (course_code, course_name, year_level, degree_code) VALUES
  ('ELEN3009', 'Digital Systems',            3, 'BSCENGINFO'),
  ('ELEN4010', 'Software Engineering',       4, 'BSCENGINFO'),
  ('ELEN4011', 'Communications',             4, 'BSCENGINFO'),
  ('ELEN2020', 'Circuit Theory',             2, 'BSCENGELEC'),
  ('ELEN3001', 'Electrical Machines',        3, 'BSCENGELEC'),
  ('ELEN4020', 'Power Systems',              4, 'BSCENGELEC');
