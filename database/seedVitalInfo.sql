-- database: database.db
-- Seed v4: all departments, degrees, and complete course lists from EBE handbook
-- Cross-referenced against official Wits EBE undergraduate course tables
-- Shared-dept courses (e.g. MINN2016 used by MINE + CIVN) kept under primary dept only
-- note courses like ELEN3020 are elen courses offered to other degrees outside engineering
-- they are included here as they fall part of department offerings and may be relevant for staff teaching them


INSERT OR IGNORE INTO departments (dept_code, dept_name, faculty_name) VALUES
  ('EIE',  'School of Electrical and Information Engineering',              'Engineering and the Built Environment'),
  ('MIA',  'School of Mechanical, Industrial and Aeronautical Engineering', 'Engineering and the Built Environment'),
  ('MINE', 'School of Mining Engineering',                                  'Engineering and the Built Environment'),
  ('ARPL', 'School of Architecture and Planning',                           'Engineering and the Built Environment'),
  ('CHMT', 'School of Chemical and Metallurgical Engineering',              'Engineering and the Built Environment'),
  ('CIVN', 'School of Civil and Environmental Engineering',                 'Engineering and the Built Environment'),
  ('FEBE', 'Faculty of Engineering and the Built Environment',              'Engineering and the Built Environment');

INSERT OR IGNORE INTO degrees (degree_code, degree_name, dept_code) VALUES
  ('BSCENGINFO',  'BSc Eng (Information)',              'EIE'),
  ('BSCENGELEC',  'BSc Eng (Electrical)',               'EIE'),
  ('BSCBME',      'BEngSc (Biomedical Engineering)',    'EIE'),
  ('BSCENGMECH',  'BSc Eng (Mechanical)',               'MIA'),
  ('BSCENGIND',   'BSc Eng (Industrial)',               'MIA'),
  ('BSCENGAERO',  'BSc Eng (Aeronautical)',             'MIA'),
  ('BSCENGMIN',   'BSc Eng (Mining)',                   'MINE'),
  ('BSCENGCHEM',  'BSc Eng (Chemical)',                 'CHMT'),
  ('BSCENGMETAL', 'BSc Eng (Metallurgy)',               'CHMT'),
  ('BSCENGCIVIL', 'BSc Eng (Civil)',                    'CIVN'),
  ('BAS',         'Bachelor of Architectural Studies',  'ARPL'),
  ('BSCURBAN',    'BSc (Urban and Regional Planning)',  'ARPL');

-- ─── EIE ─────────────────────────────────────────────────────────────────────
INSERT OR IGNORE INTO courses (course_code, course_name, year_level, dept_code) VALUES
  ('ELEN1008', 'Health System Dynamics',                              1, 'EIE'),
  ('ELEN1998', 'Vacation Work I (Electrical)',                        1, 'EIE'),
  ('ELEN2000', 'Electrical Engineering',                              2, 'EIE'),
  ('ELEN2003', 'Electric and Magnetic Systems',                       2, 'EIE'),
  ('ELEN2005', 'Signals and Systems I',                               2, 'EIE'),
  ('ELEN2016', 'Electronics I',                                       2, 'EIE'),
  ('ELEN2017', 'Electric Circuits',                                   2, 'EIE'),
  ('ELEN2020', 'Software Development I',                              2, 'EIE'),
  ('ELEN2021', 'Microprocessors',                                     2, 'EIE'),
  ('ELEN3000', 'Electromagnetic Engineering',                         3, 'EIE'),
  ('ELEN3002', 'Electronics II',                                      3, 'EIE'),
  ('ELEN3003', 'Power Engineering',                                   3, 'EIE'),
  ('ELEN3007', 'Probabilistic Systems Analysis',                      3, 'EIE'),
  ('ELEN3009', 'Software Development II',                             3, 'EIE'),
  ('ELEN3012', 'Signals and Systems II A',                            3, 'EIE'),
  ('ELEN3013', 'Signals and Systems II B',                            3, 'EIE'),
  ('ELEN3014', 'Biomedical Signals, Systems and Control',             3, 'EIE'),
  ('ELEN3015', 'Data and Information Management',                     3, 'EIE'),
  ('ELEN3016', 'Control I',                                           3, 'EIE'),
  ('ELEN3017', 'Electrical Engineering Design',                       3, 'EIE'),
  ('ELEN3018', 'Economics of Design',                                 3, 'EIE'),
  ('ELEN3020', 'Professional Practice and Software Development',      3, 'EIE'),
  ('ELEN3024', 'Communication Fundamentals',                          3, 'EIE'),
  ('ELEN3028', 'Biomedical Measurement, Instrumentation and Imaging', 3, 'EIE'),
  ('ELEN4000', 'Electrical Engineering Design II',                    4, 'EIE'),
  ('ELEN4001', 'High Frequency Techniques',                           4, 'EIE'),
  ('ELEN4002', 'Electrical Engineering Laboratory',                   4, 'EIE'),
  ('ELEN4003', 'High Voltage Engineering',                            4, 'EIE'),
  ('ELEN4006', 'Measurement Systems',                                 4, 'EIE'),
  ('ELEN4009', 'Software Engineering',                                4, 'EIE'),
  ('ELEN4010', 'Software Development III',                            4, 'EIE'),
  ('ELEN4011', 'Information Engineering Design',                      4, 'EIE'),
  ('ELEN4012', 'Information Engineering Laboratory',                  4, 'EIE'),
  ('ELEN4014', 'Electromechanical Conversion',                        4, 'EIE'),
  ('ELEN4016', 'Control II',                                          4, 'EIE'),
  ('ELEN4017', 'Network Fundamentals',                                4, 'EIE'),
  ('ELEN4018', 'Power Systems',                                       4, 'EIE'),
  ('ELEN4019', 'Selected Topics in Sociology',                        4, 'EIE'),
  ('ELEN4020', 'Data Intensive Computing in Data Science',            4, 'EIE'),
  ('ELEN4022', 'Full Stack Quantum Computing',                        4, 'EIE'),
  ('ELEN4023', 'Renewable Energy',                                    4, 'EIE'),
  ('ELEN4024', 'Secure Computing',                                    4, 'EIE'),
  ('ELEN4025', 'Introduction to Machine Learning',                    4, 'EIE');

-- ─── MIA ─────────────────────────────────────────────────────────────────────
INSERT OR IGNORE INTO courses (course_code, course_name, year_level, dept_code) VALUES
  ('MECN2026', 'Machine Elements',                        2, 'MIA'),
  ('MECN2031', 'Engineering Investigation',               2, 'MIA'),
  ('MECN2032', 'Materials Science and Engineering',       2, 'MIA'),
  ('MECN2033', 'Engineering Tools I',                     2, 'MIA'),
  ('MECN2034', 'Applied Mechanics A',                     2, 'MIA'),
  ('MECN2035', 'Applied Mechanics B',                     2, 'MIA'),
  ('MECN2036', 'Fluid Mechanics I',                       2, 'MIA'),
  ('MECN2037', 'Thermodynamics I',                        2, 'MIA'),
  ('MECN2038', 'Engineering Design',                      2, 'MIA'),
  ('MECN2039', 'Mechatronics I',                          2, 'MIA'),
  ('MECN3045', 'Industrial Engineering Design',           3, 'MIA'),
  ('MECN3048', 'Mechanics of Solids I',                   3, 'MIA'),
  ('MECN3053', 'Principles of Organisational Behaviour',  3, 'MIA'),
  ('MECN3054', 'Mechanical Vibrations',                   3, 'MIA'),
  ('MECN3061', 'Aeronautical Engineering Design',         3, 'MIA'),
  ('MECN3065', 'Aeronautics',                             3, 'MIA'),
  ('MECN3066', 'Mechatronics II',                         3, 'MIA'),
  ('MECN3067', 'Business Management',                     3, 'MIA'),
  ('MECN3068', 'Engineering in its Social Context',       3, 'MIA'),
  ('MECN3069', 'Engineering Tools II',                    3, 'MIA'),
  ('MECN3070', 'Aircraft Structures I',                   3, 'MIA'),
  ('MECN3071', 'Fluid Mechanics II',                      3, 'MIA'),
  ('MECN3072', 'Manufacturing Technology I',              3, 'MIA'),
  ('MECN3073', 'Aeronautical Engineering Investigation',  3, 'MIA'),
  ('MECN3074', 'Operations Management I',                 3, 'MIA'),
  ('MECN3075', 'Operations Research I',                   3, 'MIA'),
  ('MECN3077', 'Thermodynamics II',                       3, 'MIA'),
  ('MECN3078', 'Industrial Engineering Investigation',    3, 'MIA'),
  ('MECN3079', 'Mechanical Engineering Investigation',    3, 'MIA'),
  ('MECN3080', 'Mechanical Engineering Design',           3, 'MIA'),
  ('MECN4020', 'Systems Management and Integration',      4, 'MIA'),
  ('MECN4027', 'Aircraft Structures II',                  4, 'MIA'),
  ('MECN4034', 'Design Project',                          4, 'MIA'),
  ('MECN4035', 'Investigational Project',                 4, 'MIA'),
  ('MECN4036', 'Aeronautical Thermofluids',               4, 'MIA'),
  ('MECN4037', 'Aerodynamics',                            4, 'MIA'),
  ('MECN4038', 'Flight Dynamics and Control',             4, 'MIA'),
  ('MECN4039', 'Engineering Tools III',                   4, 'MIA'),
  ('MECN4040', 'Operations Research II',                  4, 'MIA'),
  ('MECN4041', 'Operations Management II',                4, 'MIA'),
  ('MECN4042', 'System Dynamics and Control',             4, 'MIA'),
  ('MECN4043', 'Thermodynamics III',                      4, 'MIA'),
  ('MECN4044', 'Manufacturing Technology II',             4, 'MIA'),
  ('MECN4045', 'Mechanics of Solids II',                  4, 'MIA');

-- ─── MINE ────────────────────────────────────────────────────────────────────
INSERT OR IGNORE INTO courses (course_code, course_name, year_level, dept_code) VALUES
  ('MINN2006', 'Engineering Services for Mining',                        2, 'MINE'),
  ('MINN2008', 'Introduction to Underground and Surface Mining Methods', 2, 'MINE'),
  ('MINN2010', 'Computer Applications in Mining',                        2, 'MINE'),
  ('MINN2012', 'Explosives Engineering',                                 2, 'MINE'),
  ('MINN2014', 'Mechanical Excavation of Rock',                          2, 'MINE'),
  ('MINN2016', 'Engineering Surveying',                                  2, 'MINE'),
  ('MINN2018', 'Digital Technologies and Mine Data Analytics',           2, 'MINE'),
  ('MINN2020', 'Computer Programming for Mining',                        2, 'MINE'),
  ('MINN2022', 'Professional Development',                               2, 'MINE'),
  ('MINN2024', 'Computer Programming Bootcamp (Mining)',                 2, 'MINE'),
  ('MINN3015', 'Mine Transportation, Automation and Robotics',           3, 'MINE'),
  ('MINN3016', 'Mineral Resources Evaluation',                           3, 'MINE'),
  ('MINN3017', 'Computerised Mine Design',                               3, 'MINE'),
  ('MINN3018', 'Rock Mechanics',                                         3, 'MINE'),
  ('MINN3019', 'Mine Ventilation and Climate Control',                   3, 'MINE'),
  ('MINN3020', 'Water, Energy and the Environment',                      3, 'MINE'),
  ('MINN3021', 'Mine Surveying and Geospatial Techniques',               3, 'MINE'),
  ('MINN3022', 'Underground Mining Systems',                             3, 'MINE'),
  ('MINN3023', 'Surface Mining Systems',                                 3, 'MINE'),
  ('MINN4011', 'Mine Management Principles and Entrepreneurship',        4, 'MINE'),
  ('MINN4012', 'Mining Optimisation Techniques and Systems Engineering', 4, 'MINE'),
  ('MINN4013', 'Financial Valuation',                                    4, 'MINE'),
  ('MINN4014', 'Mine Design',                                            4, 'MINE'),
  ('MINN4015', 'Project Report',                                         4, 'MINE'),
  ('MINN4016', 'Rock Engineering',                                       4, 'MINE'),
  ('MINN4017', 'Health, Safety and Mining Law',                          4, 'MINE');

-- ─── ARPL ────────────────────────────────────────────────────────────────────
-- Note: ARPL1025 is listed as Year II in the official table despite the 1xxx code
INSERT OR IGNORE INTO courses (course_code, course_name, year_level, dept_code) VALUES
  ('ARPL1000', 'Architectural Design and Theory I',                            1, 'ARPL'),
  ('ARPL1001', 'Theory and Practice of Construction I',                        1, 'ARPL'),
  ('ARPL1010', 'Planning for Property Developers',                             1, 'ARPL'),
  ('ARPL1014', 'Settlements through History',                                  1, 'ARPL'),
  ('ARPL1015', 'Introduction to Environmental Interpretation',                 1, 'ARPL'),
  ('ARPL1016', 'Introduction to Settlement Form and Design',                   1, 'ARPL'),
  ('ARPL1025', 'Two and Three Dimensional Computer Aided Design and GIS',      2, 'ARPL'),
  ('ARPL1026', 'Identity and Society I',                                       1, 'ARPL'),
  ('ARPL1028', 'Design Representation I',                                      1, 'ARPL'),
  ('ARPL1029', 'Digital Applications in Architecture I',                       1, 'ARPL'),
  ('ARPL1030', 'Building Ecology',                                             1, 'ARPL'),
  ('ARPL1031', 'Histories and Theories of Architecture I',                     1, 'ARPL'),
  ('ARPL1032', 'History of Settlement, Architecture and Planning',             1, 'ARPL'),
  ('ARPL2000', 'Architectural Design and Theory II',                           2, 'ARPL'),
  ('ARPL2002', 'Theory and Practice of Construction II',                       2, 'ARPL'),
  ('ARPL2006', 'Planning for Housing, Services, Infrastructure and Transport', 2, 'ARPL'),
  ('ARPL2012', 'Histories and Theories of Architecture II',                    2, 'ARPL'),
  ('ARPL2013', 'Introduction to Land Management',                              2, 'ARPL'),
  ('ARPL2015', 'Contemporary Design and Environmental Issues in South Africa',  2, 'ARPL'),
  ('ARPL2017', 'Histories, Theories and Futures of Planning',                  2, 'ARPL'),
  ('ARPL2018', 'Introduction to Environmental Planning',                       2, 'ARPL'),
  ('ARPL2019', 'Design Representation II',                                     2, 'ARPL'),
  ('ARPL2020', 'Digital Applications in Architecture II',                      2, 'ARPL'),
  ('ARPL2021', 'Introduction to Structures',                                   2, 'ARPL'),
  ('ARPL3002', 'Small Office Practice',                                        3, 'ARPL'),
  ('ARPL3005', 'Architectural Design and Theory III',                          3, 'ARPL'),
  ('ARPL3010', 'Comparative Planning Systems',                                 3, 'ARPL'),
  ('ARPL3021', 'Histories and Theories of Architecture III',                   3, 'ARPL'),
  ('ARPL3027', 'Regional Planning and Local Economic Development',             3, 'ARPL'),
  ('ARPL3028', 'Development Policy and Processes in South Africa',             3, 'ARPL'),
  ('ARPL3030', 'Applications in Graphic and Spatial Communication in Planning', 3, 'ARPL'),
  ('ARPL3031', 'Theory and Practice of Construction III',                      3, 'ARPL'),
  ('ARPL3032', 'The Politics of Planning and Housing',                         3, 'ARPL'),
  ('ARPL3033', 'Local Planning and Urban Design',                              3, 'ARPL'),
  ('ARPL3034', 'Integrated Development Planning',                              3, 'ARPL');

-- ─── CHMT ────────────────────────────────────────────────────────────────────
INSERT OR IGNORE INTO courses (course_code, course_name, year_level, dept_code) VALUES
  ('CHMT2009', 'Introductory Mineralogy and Earth Sciences',                    2, 'CHMT'),
  ('CHMT2011', 'Computing for Process Engineering II',                          2, 'CHMT'),
  ('CHMT2017', 'Introduction to Extractive Metallurgy',                         2, 'CHMT'),
  ('CHMT2019', 'Materials Science and Engineering',                             2, 'CHMT'),
  ('CHMT2021', 'Process Engineering Fundamentals A (Chem)',                     2, 'CHMT'),
  ('CHMT2023', 'Process Engineering Fundamentals B (Chem)',                     2, 'CHMT'),
  ('CHMT2025', 'Process Engineering Fundamentals A (Met)',                      2, 'CHMT'),
  ('CHMT2029', 'Practical Physical Metallurgy',                                 2, 'CHMT'),
  ('CHMT2030', 'Practical Extractive Metallurgy',                               2, 'CHMT'),
  ('CHMT3004', 'Chemical Engineering Laboratory',                               3, 'CHMT'),
  ('CHMT3008', 'Numerical Methods (Chemical)',                                  3, 'CHMT'),
  ('CHMT3014', 'Engineering Failure Analysis',                                  3, 'CHMT'),
  ('CHMT3019', 'Kinetics and Transport Processes in Metallurgical Engineering', 3, 'CHMT'),
  ('CHMT3021', 'Solidification, Heat Treatment and Microstructure',            3, 'CHMT'),
  ('CHMT3024', 'Environmental Process Engineering',                             3, 'CHMT'),
  ('CHMT3025', 'Crystal Structure and Analysis',                                3, 'CHMT'),
  ('CHMT3027', 'Corrosion and Wear',                                            3, 'CHMT'),
  ('CHMT3028', 'Non-Ferrous Pyrometallurgy',                                    3, 'CHMT'),
  ('CHMT3038', 'Momentum and Heat Transport',                                   3, 'CHMT'),
  ('CHMT3040', 'Applied Thermodynamics',                                        3, 'CHMT'),
  ('CHMT3041', 'Chemical Engineering Thermodynamics',                           3, 'CHMT'),
  ('CHMT3042', 'Chemical Reaction Engineering A',                               3, 'CHMT'),
  ('CHMT3043', 'Chemical Reaction Engineering B',                               3, 'CHMT'),
  ('CHMT3044', 'Process Design Principles A',                                   3, 'CHMT'),
  ('CHMT3045', 'Process Design Principles B',                                   3, 'CHMT'),
  ('CHMT3046', 'Metallurgical Thermodynamics I',                                3, 'CHMT'),
  ('CHMT3047', 'Metallurgical Thermodynamics II',                               3, 'CHMT'),
  ('CHMT3048', 'Process and Materials Design I',                                3, 'CHMT'),
  ('CHMT3049', 'Process and Materials Design II',                               3, 'CHMT'),
  ('CHMT3051', 'Mass Transfer and Separation Processes',                        3, 'CHMT'),
  ('CHMT4000', 'Hydrometallurgy',                                               4, 'CHMT'),
  ('CHMT4002', 'Physical Chemistry of Iron and Steel Manufacturing',            4, 'CHMT'),
  ('CHMT4003', 'Metallurgical Design',                                          4, 'CHMT'),
  ('CHMT4004', 'Research Project',                                              4, 'CHMT'),
  ('CHMT4005', 'Management for Process Engineers',                              4, 'CHMT'),
  ('CHMT4006', 'Solid Fluid Systems',                                           4, 'CHMT'),
  ('CHMT4008', 'Particulate Systems',                                           4, 'CHMT'),
  ('CHMT4009', 'Chemical Engineering Design',                                   4, 'CHMT'),
  ('CHMT4011', 'Process Control',                                               4, 'CHMT'),
  ('CHMT4015', 'Welding and Forming Processes',                                 4, 'CHMT'),
  ('CHMT4017', 'Structure and Properties of Engineering Materials',             4, 'CHMT'),
  ('CHMT4019', 'Chemical Engineering Research Project',                         4, 'CHMT'),
  ('CHMT4020', 'Hydrometallurgical Processes',                                  4, 'CHMT'),
  ('CHMT4029', 'Biochemical Engineering',                                       4, 'CHMT'),
  ('CHMT4030', 'Fundamentals of Pyrometallurgy',                                4, 'CHMT'),
  ('CHMT4031', 'Fundamentals of Mineral Processing',                            4, 'CHMT'),
  ('CHMT4032', 'Advanced Chemical Reaction Engineering',                        4, 'CHMT'),
  ('CHMT4033', 'Wastewater Engineering',                                        4, 'CHMT'),
  ('CHMT4034', 'Synthetic Fuels',                                               4, 'CHMT');

-- ─── CIVN ────────────────────────────────────────────────────────────────────
-- Note: MINN2016 (Engineering Surveying) also appears in Civil curriculum
-- but is kept under MINE as the primary department
INSERT OR IGNORE INTO courses (course_code, course_name, year_level, dept_code) VALUES
  ('CIVN2008', 'Materials and Structures I',                                   2, 'CIVN'),
  ('CIVN2009', 'Materials and Structures II',                                  2, 'CIVN'),
  ('CIVN2010', 'Numerical Methods',                                            2, 'CIVN'),
  ('CIVN2011', 'Probability Theory and Mathematical Statistics for Engineers', 2, 'CIVN'),
  ('CIVN2013', 'Introduction to Environmental Engineering',                    2, 'CIVN'),
  ('CIVN2014', 'Engineering Computing',                                        2, 'CIVN'),
  ('CIVN2016', 'Engineering Economics and Infrastructure Planning',            2, 'CIVN'),
  ('CIVN3001', 'Construction Materials I',                                     3, 'CIVN'),
  ('CIVN3004', 'Geotechnical Engineering I',                                   3, 'CIVN'),
  ('CIVN3010', 'Structural Steel Design',                                      3, 'CIVN'),
  ('CIVN3011', 'Reinforced Concrete Design',                                   3, 'CIVN'),
  ('CIVN3012', 'Hydrology',                                                    3, 'CIVN'),
  ('CIVN3017', 'Systems Analysis and Optimisation',                            3, 'CIVN'),
  ('CIVN3024', 'Fluid Mechanics and Hydraulics',                               3, 'CIVN'),
  ('CIVN3025', 'Structural Analysis I',                                        3, 'CIVN'),
  ('CIVN3026', 'Structural Analysis II',                                       3, 'CIVN'),
  ('CIVN3027', 'Transportation Engineering',                                   3, 'CIVN'),
  ('CIVN4000', 'Construction Materials II',                                    4, 'CIVN'),
  ('CIVN4004', 'Geotechnical Engineering II',                                  4, 'CIVN'),
  ('CIVN4005', 'Investigational Project',                                      4, 'CIVN'),
  ('CIVN4006', 'Integrated Resource Management',                               4, 'CIVN'),
  ('CIVN4010', 'Hydraulic Engineering',                                        4, 'CIVN'),
  ('CIVN4014', 'Structural Engineering',                                       4, 'CIVN'),
  ('CIVN4015', 'Civil Engineering Design',                                     4, 'CIVN');

-- ─── FEBE (shared Year 1 courses across all engineering degrees) ─────────────
INSERT OR IGNORE INTO courses (course_code, course_name, year_level, dept_code) VALUES
  ('FEBE1000', 'Introduction to the Engineering Profession', 1, 'FEBE'),
  ('FEBE1002', 'Engineering Analysis and Design IA',         1, 'FEBE'),
  ('FEBE1004', 'Engineering Analysis and Design IB',         1, 'FEBE'),
  ('CHEM1051', 'Engineering Chemistry',                      1, 'FEBE'),
  ('MATH1048', 'Engineering Mathematics IA',                 1, 'FEBE'),
  ('MATH1049', 'Engineering Mathematics IB',                 1, 'FEBE'),
  ('PHYS1032', 'Engineering Physics IA',                     1, 'FEBE'),
  ('PHYS1033', 'Engineering Physics IB',                     1, 'FEBE'),
  ('PHYS1034', 'Applied Physics I',                          1, 'FEBE');

-- ─── Staff ───────────────────────────────────────────────────────────────────
INSERT OR IGNORE INTO staff (staff_number, name, email, department, dept_code, password, email_verified) VALUES
  ('A000356', 'Clark Kent', 'clark.kent@wits.ac.za', 'EIE', 'EIE', 'pass', 1),
  ('A000357', 'Lois Lane',  'lois.lane@wits.ac.za',  'EIE', 'EIE', 'pass', 1);

-- Staff data
INSERT OR IGNORE INTO staff (staff_number, name, email, department, dept_code, password) VALUES
  ('A000356', 'John Doe', 'john.doe@wits.ac.za', 'Electrical Engineering', 'EIE', '$2b$10$dummyhashedpassword'),
  ('A000357', 'Jane Smith', 'jane.smith@wits.ac.za', 'Mechanical Engineering', 'MIA', '$2b$10$dummyhashedpassword');

INSERT OR IGNORE INTO staff_courses (staff_number, course_code) VALUES
  ('A000356', 'ELEN4010'),
  ('A000356', 'ELEN3009'),
  ('A000357', 'ELEN4020'),
  ('A000357', 'ELEN4010');

-- ─── Test student ─────────────────────────────────────────────────────────────
INSERT OR IGNORE INTO students (student_number, name, email, password, degree_code, email_verified) VALUES
  (1234567, 'Aditya Raghunandan', '2434427@students.wits.ac.za', 'pass', 'BSCENGINFO', 1);

INSERT OR IGNORE INTO enrollments (student_number, course_code) VALUES
  (1234567, 'ELEN4010'),
  (1234567, 'ELEN3009'),
  (1234567, 'ELEN4009');

-- ─── Admin ────────────────────────────────────────────────────────────────────
INSERT OR IGNORE INTO admins (admin_id, name, email, password) VALUES
  ('ADMIN001', 'System Admin', 'admin@wits.ac.za', 'admin');

INSERT OR IGNORE INTO lecturer_availability (availability_id, staff_number, day_of_week, start_time, end_time, max_booking_min, max_number_of_students, venue) VALUES
  ('1', 'A000356', 'Mon', '10:00', '11:00', 60, 5, 'Room 101'),
  ('2', 'A000357', 'Tue', '11:00', '13:00', 120, 10, 'Room 102'),
  ('3', 'A000356', 'Wed', '10:00', '14:00', 180, 10, 'Room 103'),
  ('4', 'A000357', 'Thu', '11:00', '14:00', 120, 6, 'Room 104');

-- ─── Actions ────────────────────────────────────────────────────────────────────
INSERT OR IGNORE INTO actions (action_id, action_name, page_context, description)
VALUES 
    -- Authentication & Security (10s)
    (10, 'USER_LOGIN', 'Login Page', 'User successfully logged into the system.'),
    (11, 'USER_LOGOUT', 'Home/dashboard', 'User logged out of the system.'),
    (12, 'USER_SIGNUP', 'Signup Page', 'New user registered an account.'),
    (13, 'USER_PASSWORD_CHANGE', 'Account Settings', 'User successfully changed their password.'),
    (14, 'AUTH_FAILED_LOGIN', 'Login Page', 'Failed login attempt (incorrect password/username).'),

    -- Consultations (100s)
    (100, 'CONSULT_CREATE', 'Student Dashboard', 'Student created a new consultation event.'),
    (101, 'CONSULT_JOIN', 'Student Dashboard', 'Student joined an existing consultation.'),
    (102, 'CONSULT_LEAVE', 'Student Dashboard', 'Student withdrew from an upcoming consultation.'),
    (200, 'CONSULT_CANCEL_ORG', 'Student Dashboard', 'Student organiser cancelled the consultation.'),
    (201, 'CONSULT_CANCEL_LEC', 'Lecturer Dashboard', 'Lecturer cancelled the consultation.'),

    -- Lecturer Availability (300s)
    (300, 'AVAIL_CREATE', 'Lecturer Dashboard', 'Lecturer created their weekly availability rules.'),
    (301, 'AVAIL_CANCEL', 'Lecturer Dashboard', 'Lecturer canceled a weekly availability rule.'),
    (302, 'AVAIL_UPDATE', 'Lecturer Dashboard', 'Lecturer modified existing availability times/limits.'),

    -- User Profile Management (400s)
    (400, 'PROFILE_COURSES_UPDATED', 'Courses Dashboard', 'User added or removed a new course or degree to their profile.'),

    -- Admin Actions (500s)
    (500, 'ADMIN_LOGIN', 'Admin Dashboard', 'Administrator logged into the system.'),
    (501, 'ADMIN_USER_ADD', 'Admin Dashboard', 'Administrator manually created a new user.'),
    (502, 'ADMIN_USER_EDIT', 'Admin Dashboard', 'Administrator modified a user''s details or permissions.'),
    (503, 'ADMIN_USER_DELETE', 'Admin Dashboard', 'Administrator deleted or deactivated a user.');