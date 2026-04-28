-- database: database.db
-- Seed v2: departments, degrees, courses, staff, staff_courses, student (ADR-006)

INSERT OR IGNORE INTO departments (dept_code, dept_name, faculty_name) VALUES
  ('EIE', 'School of Electrical and Information Engineering',
   'Engineering and the Built Environment'),
  ('MIA', 'School of Mechanical, Industrial and Aeronautical Engineering',
   'Engineering and the Built Environment');

INSERT OR IGNORE INTO degrees (degree_code, degree_name, dept_code) VALUES
  ('BSCENGINFO', 'BSc Eng (Information)', 'EIE'),
  ('BSCENGELEC', 'BSc Eng (Electrical)',  'EIE'),
  ('BSCENGMECH', 'BSc Eng (Mechanical)',  'MIA'),
  ('BSCENGIND',  'BSc Eng (Industrial)',  'MIA'),
  ('BSCENGAERO', 'BSc Eng (Aeronautical)','MIA');

INSERT OR IGNORE INTO courses (course_code, course_name, year_level, dept_code) VALUES
  -- EIE Year 1
  ('ELEN1008', 'Health System Dynamics',                              1, 'EIE'),
  -- EIE Year 2
  ('ELEN2017', 'Electric Circuits',                                   2, 'EIE'),
  ('ELEN2020', 'Software Development I',                              2, 'EIE'),
  ('ELEN2021', 'Microprocessors',                                     2, 'EIE'),
  -- EIE Year 3
  ('ELEN3002', 'Electronics II',                                      3, 'EIE'),
  ('ELEN3003', 'Power Engineering',                                   3, 'EIE'),
  ('ELEN3009', 'Digital Systems',                                     3, 'EIE'),
  ('ELEN3012', 'Signals and Systems IIA',                             3, 'EIE'),
  ('ELEN3015', 'Data and Information Management',                     3, 'EIE'),
  ('ELEN3028', 'Biomedical Measurement, Instrumentation and Imaging', 3, 'EIE'),
  -- EIE Year 4
  ('ELEN4001', 'High Frequency Techniques',                           4, 'EIE'),
  ('ELEN4003', 'High Voltage Engineering',                            4, 'EIE'),
  ('ELEN4006', 'Measurement Systems',                                 4, 'EIE'),
  ('ELEN4010', 'Software Development III',                            4, 'EIE'),
  ('ELEN4011', 'Communications',                                      4, 'EIE'),
  ('ELEN4014', 'Electromechanical Conversion',                        4, 'EIE'),
  ('ELEN4016', 'Control II',                                          4, 'EIE'),
  ('ELEN4017', 'Network Fundamentals',                                4, 'EIE'),
  ('ELEN4018', 'Power Systems',                                       4, 'EIE'),
  ('ELEN4020', 'Data Intensive Computing in Data Science',            4, 'EIE'),
  ('ELEN4022', 'Full Stack Quantum Computing',                        4, 'EIE'),
  ('ELEN4023', 'Renewable Energy',                                    4, 'EIE'),
  ('ELEN4024', 'Secure Computing',                                    4, 'EIE'),
  -- MIA Year 2
  ('MECN2032', 'Materials Science and Engineering',                   2, 'MIA'),
  ('MECN2033', 'Engineering Tools II',                                2, 'MIA'),
  ('MECN2034', 'Applied Mechanics A',                                 2, 'MIA'),
  ('MECN2037', 'Engineering Thermodynamics I',                        2, 'MIA'),
  -- MIA Year 3
  ('MECN3048', 'Mechanics of Solids',                                 3, 'MIA'),
  ('MECN3053', 'Principles of Organisational Behaviour',              3, 'MIA'),
  ('MECN3065', 'Aeronautics',                                         3, 'MIA'),
  ('MECN3067', 'Business Management',                                 3, 'MIA'),
  ('MECN3071', 'Fluid Mechanics II',                                  3, 'MIA'),
  ('MECN3074', 'Operations Management I',                             3, 'MIA'),
  -- MIA Year 4
  ('MECN4020', 'Systems Management and Integration',                  4, 'MIA'),
  ('MECN4027', 'Aircraft Structures II',                              4, 'MIA'),
  ('MECN4036', 'Aeronautical Thermofluids',                           4, 'MIA'),
  ('MECN4037', 'Aerodynamics',                                        4, 'MIA'),
  ('MECN4038', 'Flight Dynamics and Control',                         4, 'MIA'),
  ('MECN4041', 'Operations Management II',                            4, 'MIA'),
  ('MECN4042', 'System Dynamics and Control',                         4, 'MIA'),
  ('MECN4043', 'Thermodynamics III',                                  4, 'MIA'),
  ('MECN4044', 'Manufacturing Technology II',                         4, 'MIA');

INSERT OR IGNORE INTO staff (staff_number, name, email, department, dept_code, password) VALUES
  ('A000356', 'Clark Kent', 'clark.kent@wits.ac.za', 'EIE', 'EIE', 'pass'),
  ('A000357', 'Lois Lane',  'lois.lane@wits.ac.za',  'EIE', 'EIE', 'pass');

INSERT OR IGNORE INTO staff_courses (staff_number, course_code) VALUES
  ('A000356', 'ELEN4010'),
  ('A000356', 'ELEN3009'),
  ('A000357', 'ELEN4020'),
  ('A000357', 'ELEN4010');

INSERT OR IGNORE INTO students (student_number, name, email, password, degree_code) VALUES
  (1234567, 'Aditya Raghunandan', 'aditya@students.wits.ac.za', 'pass', 'BSCENGINFO');
