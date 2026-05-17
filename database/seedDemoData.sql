-- database: database.db
-- Demo Seed v1: realistic demo data
-- Run AFTER seedVitalInfo.sql (handled by setup.js)
--
-- Adds 11 new lecturers covering ALL courses across all 7 departments,
-- 68 availability slots (Mon-Fri, 2 time chunks per day per lecturer),
-- 5 demo students, and 15 pre-seeded consultations spread across the
-- next 2 weeks from 2026-05-15 (dates: 2026-05-18 to 2026-05-29).
--
-- All consultation dates match the day_of_week of their availability slot.

-- ─── Demo Lecturers ──────────────────────────────────────────────────────────
-- EIE (2 new + 2 existing: Clark Kent A000356, Lois Lane A000357)
-- MIA, MINE, ARPL, CHMT, CIVN, FEBE (1-2 new each)
INSERT OR IGNORE INTO staff (staff_number, name, email, department, dept_code, password, email_verified) VALUES
  ('A000358', 'Bruce Wayne',      'bruce.wayne@wits.ac.za',      'EIE',  'EIE',  'pass', 1),
  ('A000359', 'Diana Prince',     'diana.prince@wits.ac.za',     'EIE',  'EIE',  'pass', 1),
  ('A000360', 'Tony Stark',       'tony.stark@wits.ac.za',       'MIA',  'MIA',  'pass', 1),
  ('A000361', 'Natasha Romanoff', 'natasha.romanoff@wits.ac.za', 'CIVN', 'CIVN', 'pass', 1),
  ('A000362', 'Steve Rogers',     'steve.rogers@wits.ac.za',     'CHMT', 'CHMT', 'pass', 1),
  ('A000363', 'Peter Parker',     'peter.parker@wits.ac.za',     'MIA',  'MIA',  'pass', 1),
  ('A000364', 'Thor Odinson',     'thor.odinson@wits.ac.za',     'MINE', 'MINE', 'pass', 1),
  ('A000365', 'Wanda Maximoff',   'wanda.maximoff@wits.ac.za',   'ARPL', 'ARPL', 'pass', 1),
  ('A000366', 'Nick Fury',        'nick.fury@wits.ac.za',        'CHMT', 'CHMT', 'pass', 1),
  ('A000367', 'Sam Wilson',       'sam.wilson@wits.ac.za',       'CIVN', 'CIVN', 'pass', 1),
  ('A000368', 'Maria Hill',       'maria.hill@wits.ac.za',       'FEBE', 'FEBE', 'pass', 1);

-- ─── Staff Course Assignments ─────────────────────────────────────────────────
-- Every course in every dept is assigned to at least one lecturer.
-- Existing assignments in seedVitalInfo.sql (Clark→ELEN4010,ELEN3009;
-- Lois→ELEN4020,ELEN4010) are repeated safely via INSERT OR IGNORE.

-- ── EIE: split across Clark Kent (Year 1-2), Lois Lane (Year 3),
--         Bruce Wayne (Year 4 part 1), Diana Prince (Year 4 part 2) ──────────
INSERT OR IGNORE INTO staff_courses (staff_number, course_code) VALUES
  -- Clark Kent (A000356): Year 1 + Year 2
  ('A000356', 'ELEN1008'), ('A000356', 'ELEN1998'),
  ('A000356', 'ELEN2000'), ('A000356', 'ELEN2003'), ('A000356', 'ELEN2005'),
  ('A000356', 'ELEN2016'), ('A000356', 'ELEN2017'), ('A000356', 'ELEN2020'),
  ('A000356', 'ELEN2021'), ('A000356', 'ELEN3009'), ('A000356', 'ELEN4010');

INSERT OR IGNORE INTO staff_courses (staff_number, course_code) VALUES
  -- Lois Lane (A000357): Year 3
  ('A000357', 'ELEN3000'), ('A000357', 'ELEN3002'), ('A000357', 'ELEN3003'),
  ('A000357', 'ELEN3007'), ('A000357', 'ELEN3009'), ('A000357', 'ELEN3012'),
  ('A000357', 'ELEN3013'), ('A000357', 'ELEN3014'), ('A000357', 'ELEN3015'),
  ('A000357', 'ELEN3016'), ('A000357', 'ELEN3017'), ('A000357', 'ELEN3018'),
  ('A000357', 'ELEN3020'), ('A000357', 'ELEN3024'), ('A000357', 'ELEN3028'),
  ('A000357', 'ELEN4010'), ('A000357', 'ELEN4020');

INSERT OR IGNORE INTO staff_courses (staff_number, course_code) VALUES
  -- Bruce Wayne (A000358): Year 4 part 1
  ('A000358', 'ELEN3009'), ('A000358', 'ELEN4010'), ('A000358', 'ELEN4025'),
  ('A000358', 'ELEN4000'), ('A000358', 'ELEN4001'), ('A000358', 'ELEN4002'),
  ('A000358', 'ELEN4003'), ('A000358', 'ELEN4006'), ('A000358', 'ELEN4009'),
  ('A000358', 'ELEN4011'), ('A000358', 'ELEN4012'), ('A000358', 'ELEN4014');

INSERT OR IGNORE INTO staff_courses (staff_number, course_code) VALUES
  -- Diana Prince (A000359): Year 4 part 2
  ('A000359', 'ELEN3015'), ('A000359', 'ELEN4009'), ('A000359', 'ELEN4020'),
  ('A000359', 'ELEN4016'), ('A000359', 'ELEN4017'), ('A000359', 'ELEN4018'),
  ('A000359', 'ELEN4019'), ('A000359', 'ELEN4022'), ('A000359', 'ELEN4023'),
  ('A000359', 'ELEN4024');

-- ── MIA: Tony Stark (Year 2 + Year 3 first half), Peter Parker (Year 3 second half + Year 4) ──
INSERT OR IGNORE INTO staff_courses (staff_number, course_code) VALUES
  -- Tony Stark (A000360)
  ('A000360', 'MECN2026'), ('A000360', 'MECN2031'), ('A000360', 'MECN2032'),
  ('A000360', 'MECN2033'), ('A000360', 'MECN2034'), ('A000360', 'MECN2035'),
  ('A000360', 'MECN2036'), ('A000360', 'MECN2037'), ('A000360', 'MECN2038'),
  ('A000360', 'MECN2039'), ('A000360', 'MECN3045'), ('A000360', 'MECN3048'),
  ('A000360', 'MECN3053'), ('A000360', 'MECN3054'), ('A000360', 'MECN3061'),
  ('A000360', 'MECN3065'), ('A000360', 'MECN3066'), ('A000360', 'MECN3067'),
  ('A000360', 'MECN3068'), ('A000360', 'MECN3069'), ('A000360', 'MECN3071'),
  ('A000360', 'MECN3077'), ('A000360', 'MECN4034');

INSERT OR IGNORE INTO staff_courses (staff_number, course_code) VALUES
  -- Peter Parker (A000363)
  ('A000363', 'MECN3070'), ('A000363', 'MECN3071'), ('A000363', 'MECN3072'),
  ('A000363', 'MECN3073'), ('A000363', 'MECN3074'), ('A000363', 'MECN3075'),
  ('A000363', 'MECN3077'), ('A000363', 'MECN3078'), ('A000363', 'MECN3079'),
  ('A000363', 'MECN3080'), ('A000363', 'MECN4020'), ('A000363', 'MECN4027'),
  ('A000363', 'MECN4034'), ('A000363', 'MECN4035'), ('A000363', 'MECN4036'),
  ('A000363', 'MECN4037'), ('A000363', 'MECN4038'), ('A000363', 'MECN4039'),
  ('A000363', 'MECN4040'), ('A000363', 'MECN4041'), ('A000363', 'MECN4042'),
  ('A000363', 'MECN4043'), ('A000363', 'MECN4044'), ('A000363', 'MECN4045');

-- ── MINE: Thor Odinson covers all 27 MINE courses ────────────────────────────
INSERT OR IGNORE INTO staff_courses (staff_number, course_code) VALUES
  ('A000364', 'MINN2006'), ('A000364', 'MINN2008'), ('A000364', 'MINN2010'),
  ('A000364', 'MINN2012'), ('A000364', 'MINN2014'), ('A000364', 'MINN2016'),
  ('A000364', 'MINN2018'), ('A000364', 'MINN2020'), ('A000364', 'MINN2022'),
  ('A000364', 'MINN2024'), ('A000364', 'MINN3015'), ('A000364', 'MINN3016'),
  ('A000364', 'MINN3017'), ('A000364', 'MINN3018'), ('A000364', 'MINN3019'),
  ('A000364', 'MINN3020'), ('A000364', 'MINN3021'), ('A000364', 'MINN3022'),
  ('A000364', 'MINN3023'), ('A000364', 'MINN4011'), ('A000364', 'MINN4012'),
  ('A000364', 'MINN4013'), ('A000364', 'MINN4014'), ('A000364', 'MINN4015'),
  ('A000364', 'MINN4016'), ('A000364', 'MINN4017');

-- ── ARPL: Wanda Maximoff covers all ARPL courses ─────────────────────────────
INSERT OR IGNORE INTO staff_courses (staff_number, course_code) VALUES
  ('A000365', 'ARPL1000'), ('A000365', 'ARPL1001'), ('A000365', 'ARPL1010'),
  ('A000365', 'ARPL1014'), ('A000365', 'ARPL1015'), ('A000365', 'ARPL1016'),
  ('A000365', 'ARPL1025'), ('A000365', 'ARPL1026'), ('A000365', 'ARPL1028'),
  ('A000365', 'ARPL1029'), ('A000365', 'ARPL1030'), ('A000365', 'ARPL1031'),
  ('A000365', 'ARPL1032'), ('A000365', 'ARPL2000'), ('A000365', 'ARPL2002'),
  ('A000365', 'ARPL2006'), ('A000365', 'ARPL2012'), ('A000365', 'ARPL2013'),
  ('A000365', 'ARPL2015'), ('A000365', 'ARPL2017'), ('A000365', 'ARPL2018'),
  ('A000365', 'ARPL2019'), ('A000365', 'ARPL2020'), ('A000365', 'ARPL2021'),
  ('A000365', 'ARPL3002'), ('A000365', 'ARPL3005'), ('A000365', 'ARPL3010'),
  ('A000365', 'ARPL3021'), ('A000365', 'ARPL3027'), ('A000365', 'ARPL3028'),
  ('A000365', 'ARPL3030'), ('A000365', 'ARPL3031'), ('A000365', 'ARPL3032'),
  ('A000365', 'ARPL3033'), ('A000365', 'ARPL3034');

-- ── CHMT: Steve Rogers (Year 2 + Year 3 first half), Nick Fury (Year 3 second half + Year 4) ──
INSERT OR IGNORE INTO staff_courses (staff_number, course_code) VALUES
  -- Steve Rogers (A000362)
  ('A000362', 'CHMT2009'), ('A000362', 'CHMT2011'), ('A000362', 'CHMT2017'),
  ('A000362', 'CHMT2019'), ('A000362', 'CHMT2021'), ('A000362', 'CHMT2023'),
  ('A000362', 'CHMT2025'), ('A000362', 'CHMT2029'), ('A000362', 'CHMT2030'),
  ('A000362', 'CHMT3004'), ('A000362', 'CHMT3008'), ('A000362', 'CHMT3014'),
  ('A000362', 'CHMT3019'), ('A000362', 'CHMT3021'), ('A000362', 'CHMT3024'),
  ('A000362', 'CHMT3025'), ('A000362', 'CHMT3027'), ('A000362', 'CHMT3028'),
  ('A000362', 'CHMT3038'), ('A000362', 'CHMT3040'), ('A000362', 'CHMT3041'),
  ('A000362', 'CHMT3042'), ('A000362', 'CHMT3043'), ('A000362', 'CHMT3044'),
  ('A000362', 'CHMT4009'), ('A000362', 'CHMT4011');

INSERT OR IGNORE INTO staff_courses (staff_number, course_code) VALUES
  -- Nick Fury (A000366)
  ('A000366', 'CHMT3045'), ('A000366', 'CHMT3046'), ('A000366', 'CHMT3047'),
  ('A000366', 'CHMT3048'), ('A000366', 'CHMT3049'), ('A000366', 'CHMT3051'),
  ('A000366', 'CHMT4000'), ('A000366', 'CHMT4002'), ('A000366', 'CHMT4003'),
  ('A000366', 'CHMT4004'), ('A000366', 'CHMT4005'), ('A000366', 'CHMT4006'),
  ('A000366', 'CHMT4008'), ('A000366', 'CHMT4009'), ('A000366', 'CHMT4011'),
  ('A000366', 'CHMT4015'), ('A000366', 'CHMT4017'), ('A000366', 'CHMT4019'),
  ('A000366', 'CHMT4020'), ('A000366', 'CHMT4029'), ('A000366', 'CHMT4030'),
  ('A000366', 'CHMT4031'), ('A000366', 'CHMT4032'), ('A000366', 'CHMT4033'),
  ('A000366', 'CHMT4034');

-- ── CIVN: Natasha Romanoff (Year 2 + Year 3 first half), Sam Wilson (Year 3 second half + Year 4) ──
INSERT OR IGNORE INTO staff_courses (staff_number, course_code) VALUES
  -- Natasha Romanoff (A000361)
  ('A000361', 'CIVN2008'), ('A000361', 'CIVN2009'), ('A000361', 'CIVN2010'),
  ('A000361', 'CIVN2011'), ('A000361', 'CIVN2013'), ('A000361', 'CIVN2014'),
  ('A000361', 'CIVN2016'), ('A000361', 'CIVN3001'), ('A000361', 'CIVN3004'),
  ('A000361', 'CIVN3010'), ('A000361', 'CIVN3011'), ('A000361', 'CIVN3012'),
  ('A000361', 'CIVN3017'), ('A000361', 'CIVN3027'), ('A000361', 'CIVN4014');

INSERT OR IGNORE INTO staff_courses (staff_number, course_code) VALUES
  -- Sam Wilson (A000367)
  ('A000367', 'CIVN3024'), ('A000367', 'CIVN3025'), ('A000367', 'CIVN3026'),
  ('A000367', 'CIVN3027'), ('A000367', 'CIVN4000'), ('A000367', 'CIVN4004'),
  ('A000367', 'CIVN4005'), ('A000367', 'CIVN4006'), ('A000367', 'CIVN4010'),
  ('A000367', 'CIVN4014'), ('A000367', 'CIVN4015');

-- ── FEBE: Maria Hill covers all 9 shared Year 1 courses ──────────────────────
INSERT OR IGNORE INTO staff_courses (staff_number, course_code) VALUES
  ('A000368', 'FEBE1000'), ('A000368', 'FEBE1002'), ('A000368', 'FEBE1004'),
  ('A000368', 'CHEM1051'), ('A000368', 'MATH1048'), ('A000368', 'MATH1049'),
  ('A000368', 'PHYS1032'), ('A000368', 'PHYS1033'), ('A000368', 'PHYS1034');

-- ─── Lecturer Availability ────────────────────────────────────────────────────
-- IDs 5–72, continuing from the 4 in seedVitalInfo.sql.
-- Each lecturer has 2 time slots on most weekdays for variety.

-- Bruce Wayne (A000358): IDs 5-11
INSERT OR IGNORE INTO lecturer_availability (availability_id, staff_number, day_of_week, start_time, end_time, max_booking_min, max_number_of_students, venue) VALUES
  ( 5, 'A000358', 'Mon', '09:00', '10:00', 60, 4, 'Room 201'),
  ( 6, 'A000358', 'Mon', '14:00', '15:00', 60, 3, 'Teams'),
  ( 7, 'A000358', 'Tue', '09:00', '10:30', 90, 5, 'Room 202'),
  ( 8, 'A000358', 'Tue', '15:00', '16:00', 60, 3, 'Lab 2A'),
  ( 9, 'A000358', 'Wed', '10:00', '11:00', 60, 4, 'Room 203'),
  (10, 'A000358', 'Thu', '09:00', '10:00', 60, 3, 'Room 204'),
  (11, 'A000358', 'Fri', '10:00', '11:00', 60, 5, 'Room 205');

-- Diana Prince (A000359): IDs 12-18
INSERT OR IGNORE INTO lecturer_availability (availability_id, staff_number, day_of_week, start_time, end_time, max_booking_min, max_number_of_students, venue) VALUES
  (12, 'A000359', 'Mon', '10:00', '11:00', 60, 4, 'Room 206'),
  (13, 'A000359', 'Mon', '15:00', '16:00', 60, 3, 'Teams'),
  (14, 'A000359', 'Tue', '10:00', '11:00', 60, 4, 'Room 207'),
  (15, 'A000359', 'Wed', '09:00', '10:00', 60, 5, 'Room 208'),
  (16, 'A000359', 'Wed', '14:00', '15:00', 60, 3, 'Lab 3B'),
  (17, 'A000359', 'Thu', '10:00', '11:30', 90, 4, 'Room 209'),
  (18, 'A000359', 'Fri', '09:00', '10:00', 60, 3, 'Room 210');

-- Tony Stark (A000360): IDs 19-24
INSERT OR IGNORE INTO lecturer_availability (availability_id, staff_number, day_of_week, start_time, end_time, max_booking_min, max_number_of_students, venue) VALUES
  (19, 'A000360', 'Mon', '09:00', '10:00', 60, 4, 'Eng Lab A'),
  (20, 'A000360', 'Mon', '13:00', '14:00', 60, 3, 'Teams'),
  (21, 'A000360', 'Tue', '11:00', '12:00', 60, 5, 'Eng Lab A'),
  (22, 'A000360', 'Wed', '09:00', '10:30', 90, 4, 'Eng Lab A'),
  (23, 'A000360', 'Thu', '14:00', '15:00', 60, 3, 'Eng Lab B'),
  (24, 'A000360', 'Fri', '11:00', '12:00', 60, 5, 'Eng Lab A');

-- Natasha Romanoff (A000361): IDs 25-30
INSERT OR IGNORE INTO lecturer_availability (availability_id, staff_number, day_of_week, start_time, end_time, max_booking_min, max_number_of_students, venue) VALUES
  (25, 'A000361', 'Mon', '10:00', '11:00', 60, 4, 'Room 301'),
  (26, 'A000361', 'Tue', '09:00', '10:00', 60, 3, 'Room 302'),
  (27, 'A000361', 'Wed', '10:00', '11:00', 60, 4, 'Room 303'),
  (28, 'A000361', 'Thu', '09:00', '10:00', 60, 5, 'Room 304'),
  (29, 'A000361', 'Thu', '15:00', '16:00', 60, 3, 'Teams'),
  (30, 'A000361', 'Fri', '10:00', '11:00', 60, 4, 'Room 305');

-- Steve Rogers (A000362): IDs 31-36
INSERT OR IGNORE INTO lecturer_availability (availability_id, staff_number, day_of_week, start_time, end_time, max_booking_min, max_number_of_students, venue) VALUES
  (31, 'A000362', 'Mon', '09:00', '10:00', 60, 4, 'Chem Lab 1'),
  (32, 'A000362', 'Mon', '14:00', '15:00', 60, 3, 'Teams'),
  (33, 'A000362', 'Tue', '10:00', '11:00', 60, 5, 'Chem Lab 1'),
  (34, 'A000362', 'Wed', '09:00', '10:00', 60, 4, 'Chem Lab 2'),
  (35, 'A000362', 'Thu', '10:00', '11:00', 60, 3, 'Chem Lab 1'),
  (36, 'A000362', 'Fri', '09:00', '10:00', 60, 5, 'Chem Lab 2');

-- Peter Parker (A000363): IDs 37-42
INSERT OR IGNORE INTO lecturer_availability (availability_id, staff_number, day_of_week, start_time, end_time, max_booking_min, max_number_of_students, venue) VALUES
  (37, 'A000363', 'Mon', '11:00', '12:00', 60, 4, 'Eng Lab B'),
  (38, 'A000363', 'Mon', '15:00', '16:00', 60, 3, 'Teams'),
  (39, 'A000363', 'Tue', '09:00', '10:00', 60, 5, 'Eng Lab B'),
  (40, 'A000363', 'Wed', '11:00', '12:00', 60, 4, 'Eng Lab B'),
  (41, 'A000363', 'Thu', '10:00', '11:00', 60, 3, 'Eng Lab B'),
  (42, 'A000363', 'Fri', '14:00', '15:00', 60, 5, 'Teams');

-- Thor Odinson (A000364): IDs 43-48
INSERT OR IGNORE INTO lecturer_availability (availability_id, staff_number, day_of_week, start_time, end_time, max_booking_min, max_number_of_students, venue) VALUES
  (43, 'A000364', 'Mon', '09:00', '10:00', 60, 5, 'Mine Eng Room 1'),
  (44, 'A000364', 'Mon', '14:00', '15:00', 60, 4, 'Teams'),
  (45, 'A000364', 'Tue', '10:00', '11:00', 60, 5, 'Mine Eng Room 1'),
  (46, 'A000364', 'Wed', '09:00', '10:00', 60, 4, 'Mine Eng Room 2'),
  (47, 'A000364', 'Thu', '11:00', '12:00', 60, 3, 'Mine Eng Room 1'),
  (48, 'A000364', 'Fri', '10:00', '11:00', 60, 5, 'Mine Eng Room 2');

-- Wanda Maximoff (A000365): IDs 49-54
INSERT OR IGNORE INTO lecturer_availability (availability_id, staff_number, day_of_week, start_time, end_time, max_booking_min, max_number_of_students, venue) VALUES
  (49, 'A000365', 'Mon', '10:00', '11:00', 60, 4, 'Architecture Studio 1'),
  (50, 'A000365', 'Mon', '15:00', '16:00', 60, 3, 'Teams'),
  (51, 'A000365', 'Tue', '11:00', '12:00', 60, 5, 'Architecture Studio 1'),
  (52, 'A000365', 'Wed', '10:00', '11:00', 60, 4, 'Architecture Studio 2'),
  (53, 'A000365', 'Thu', '09:00', '10:00', 60, 3, 'Architecture Studio 1'),
  (54, 'A000365', 'Fri', '11:00', '12:00', 60, 5, 'Teams');

-- Nick Fury (A000366): IDs 55-60
INSERT OR IGNORE INTO lecturer_availability (availability_id, staff_number, day_of_week, start_time, end_time, max_booking_min, max_number_of_students, venue) VALUES
  (55, 'A000366', 'Mon', '11:00', '12:00', 60, 4, 'Chem Lab 3'),
  (56, 'A000366', 'Mon', '14:00', '15:00', 60, 3, 'Teams'),
  (57, 'A000366', 'Tue', '09:00', '10:00', 60, 5, 'Chem Lab 3'),
  (58, 'A000366', 'Wed', '13:00', '14:00', 60, 4, 'Chem Lab 3'),
  (59, 'A000366', 'Thu', '10:00', '11:00', 60, 3, 'Chem Lab 4'),
  (60, 'A000366', 'Fri', '13:00', '14:00', 60, 5, 'Teams');

-- Sam Wilson (A000367): IDs 61-66
INSERT OR IGNORE INTO lecturer_availability (availability_id, staff_number, day_of_week, start_time, end_time, max_booking_min, max_number_of_students, venue) VALUES
  (61, 'A000367', 'Mon', '09:00', '10:00', 60, 4, 'Civil Eng Room 1'),
  (62, 'A000367', 'Mon', '13:00', '14:00', 60, 3, 'Teams'),
  (63, 'A000367', 'Tue', '10:00', '11:00', 60, 5, 'Civil Eng Room 1'),
  (64, 'A000367', 'Wed', '09:00', '10:00', 60, 4, 'Civil Eng Room 2'),
  (65, 'A000367', 'Thu', '14:00', '15:00', 60, 3, 'Civil Eng Room 1'),
  (66, 'A000367', 'Fri', '10:00', '11:00', 60, 5, 'Civil Eng Room 2');

-- Maria Hill (A000368): IDs 67-72
INSERT OR IGNORE INTO lecturer_availability (availability_id, staff_number, day_of_week, start_time, end_time, max_booking_min, max_number_of_students, venue) VALUES
  (67, 'A000368', 'Mon', '09:00', '10:00', 60, 6, 'Lecture Hall A'),
  (68, 'A000368', 'Mon', '14:00', '15:00', 60, 6, 'Teams'),
  (69, 'A000368', 'Tue', '09:00', '10:00', 60, 6, 'Lecture Hall A'),
  (70, 'A000368', 'Wed', '10:00', '11:00', 60, 6, 'Lecture Hall B'),
  (71, 'A000368', 'Thu', '09:00', '10:00', 60, 6, 'Lecture Hall A'),
  (72, 'A000368', 'Fri', '10:00', '11:00', 60, 6, 'Lecture Hall B');

-- ─── Demo Students ───────────────────────────────────────────────────────────
INSERT OR IGNORE INTO students (student_number, name, email, password, degree_code, email_verified) VALUES
  (2345678, 'Thabo Nkosi',    'thabo.nkosi@students.wits.ac.za',    'pass', 'BSCENGELEC', 1),
  (3456789, 'Priya Patel',    'priya.patel@students.wits.ac.za',    'pass', 'BSCENGINFO', 1),
  (4567890, 'James Okafor',   'james.okafor@students.wits.ac.za',   'pass', 'BSCENGMECH', 1),
  (5678901, 'Lerato Dlamini', 'lerato.dlamini@students.wits.ac.za', 'pass', 'BSCENGINFO', 1),
  (6789012, 'Chen Wei',       'chen.wei@students.wits.ac.za',       'pass', 'BSCENGELEC', 1);

-- ─── Student Enrollments ─────────────────────────────────────────────────────
-- Matched to lecturers' staff_courses so each student can see the correct availability
INSERT OR IGNORE INTO enrollments (student_number, course_code) VALUES
  -- Thabo (EIE) → sees Bruce Wayne + Diana Prince
  (2345678, 'ELEN4010'), (2345678, 'ELEN4025'), (2345678, 'ELEN4020'),
  -- Priya (EIE) → sees Bruce Wayne + Lois Lane
  (3456789, 'ELEN4010'), (3456789, 'ELEN3009'), (3456789, 'ELEN3015'),
  -- James (MIA) → sees Tony Stark + Peter Parker
  (4567890, 'MECN4034'), (4567890, 'MECN3071'), (4567890, 'MECN3077'),
  -- Lerato (CIVN) → sees Natasha Romanoff + Sam Wilson
  (5678901, 'CIVN3027'), (5678901, 'CIVN4014'), (5678901, 'CIVN3011'),
  -- Chen Wei (CHMT) → sees Steve Rogers + Nick Fury
  (6789012, 'CHMT3038'), (6789012, 'CHMT4011'), (6789012, 'CHMT4009');

-- Enroll existing test student (Aditya, 2434427) in one course per lecturer
-- that has pre-seeded consultations, so logging in as Aditya shows all of them.
-- Bruce Wayne is already covered via ELEN4010 + ELEN3009 in seedVitalInfo.sql.
INSERT OR IGNORE INTO enrollments (student_number, course_code) VALUES
  (2434427, 'ELEN4025'),  -- Bruce Wayne (extra, already covered)
  (2434427, 'ELEN4020'),  -- Diana Prince  → sees her Wed/Thu/Fri consultations
  (2434427, 'MECN4034'),  -- Tony Stark    → sees his Thu/Fri/Tue consultations
  (2434427, 'CIVN3027'),  -- Natasha Romanoff → sees her Fri/Wed consultations
  (2434427, 'CHMT4009');  -- Steve Rogers  → sees his Wed/Mon consultations

-- ─── Consultations ───────────────────────────────────────────────────────────
-- Date → day_of_week mapping:
--   2026-05-18 Mon | 2026-05-19 Tue | 2026-05-20 Wed
--   2026-05-21 Thu | 2026-05-22 Fri | 2026-05-25 Mon
--   2026-05-26 Tue | 2026-05-27 Wed | 2026-05-28 Thu | 2026-05-29 Fri

-- JOINABLE (status=Booked, allow_join=1, partially filled — demo presenter can join)
INSERT OR IGNORE INTO consultations
  (const_id, consultation_title, consultation_description, consultation_date, consultation_time,
   lecturer_id, organiser, availability_id, duration_min, max_number_of_students, venue, status, allow_join)
VALUES
  ('2026-05-19-00001', 'SD3 - Assignment 3 Q&A',
   'Covering async patterns and testing strategies for Assignment 3.',
   '2026-05-19', '09:00', 'A000358', 2345678,  7, 60, 5, 'Room 202',   'Booked', 1),

  ('2026-05-20-00001', 'ELEN4020 - Data Science Pipeline Help',
   'Questions on the Spark pipeline task and data wrangling.',
   '2026-05-20', '09:00', 'A000359', 3456789, 15, 60, 5, 'Room 208',   'Booked', 1),

  ('2026-05-21-00001', 'MIA - Thermofluids Design Review',
   'Going over the design brief rubric and marking scheme together.',
   '2026-05-21', '14:00', 'A000360', 4567890, 23, 60, 3, 'Eng Lab B',  'Booked', 1),

  ('2026-05-22-00001', 'CIVN - Structural Eng Friday Session',
   'Beam analysis and load calculation support before submission.',
   '2026-05-22', '10:00', 'A000361', 5678901, 30, 60, 4, 'Room 305',   'Booked', 1),

  ('2026-05-26-00001', 'SD3 - Sprint Planning Support',
   'Help defining sprint goals, user stories, and acceptance criteria.',
   '2026-05-26', '09:00', 'A000358', 2345678,  7, 60, 5, 'Room 202',   'Booked', 1),

  ('2026-05-27-00001', 'CHMT - Process Control Catch-up',
   'Catching up on PID tuning examples and controller design from Week 8.',
   '2026-05-27', '09:00', 'A000362', 6789012, 34, 60, 4, 'Chem Lab 2', 'Booked', 1),

  ('2026-05-28-00001', 'ELEN3015 - Data Management Q&A',
   'Schema design, normalisation, and query optimisation questions.',
   '2026-05-28', '10:00', 'A000359', 3456789, 17, 60, 4, 'Room 209',   'Booked', 1),

  ('2026-05-29-00001', 'MIA - Friday Office Hours',
   'Open session for 4th-year MIA students on any course content.',
   '2026-05-29', '11:00', 'A000360', 4567890, 24, 60, 5, 'Eng Lab A',  'Booked', 1);

-- FULL (allow_join=1 but attendees = capacity — demonstrates capacity enforcement)
INSERT OR IGNORE INTO consultations
  (const_id, consultation_title, consultation_description, consultation_date, consultation_time,
   lecturer_id, organiser, availability_id, duration_min, max_number_of_students, venue, status, allow_join)
VALUES
  ('2026-05-20-00002', 'SD3 - Debugging Session (FULL)',
   'No seats remaining — all 4 spots taken.',
   '2026-05-20', '10:00', 'A000358', 2345678,  9, 60, 4, 'Room 203',  'Booked', 1),

  ('2026-05-27-00002', 'MIA - Design Review (FULL)',
   'No seats remaining — all 4 spots taken.',
   '2026-05-27', '09:00', 'A000360', 4567890, 22, 60, 4, 'Eng Lab A', 'Booked', 1);

-- ALLOW_JOIN=0 (join flag disabled — demonstrates the restriction)
INSERT OR IGNORE INTO consultations
  (const_id, consultation_title, consultation_description, consultation_date, consultation_time,
   lecturer_id, organiser, availability_id, duration_min, max_number_of_students, venue, status, allow_join)
VALUES
  ('2026-05-19-00002', 'MIA - Private Pre-exam Revision',
   'Closed session, invite only. Join is disabled.',
   '2026-05-19', '11:00', 'A000360', 4567890, 21, 60, 5, 'Eng Lab A', 'Booked', 0);

-- EMPTY/FRESH (organiser booked, nobody else joined — demo presenter joins these live)
INSERT OR IGNORE INTO consultations
  (const_id, consultation_title, consultation_description, consultation_date, consultation_time,
   lecturer_id, organiser, availability_id, duration_min, max_number_of_students, venue, status, allow_join)
VALUES
  ('2026-05-18-00001', 'SD3 - Monday Morning Help',
   'Open session. Come with any SD3 questions.',
   '2026-05-18', '09:00', 'A000358', 2345678,  5, 60, 4, 'Room 201',   'Booked', 1),

  ('2026-05-20-00003', 'CIVN - Structural Problem Set 4',
   'Getting started on Problem Set 4 together.',
   '2026-05-20', '10:00', 'A000361', 5678901, 27, 60, 4, 'Room 303',   'Booked', 1),

  ('2026-05-25-00001', 'CHMT - Monday Open Session',
   'Open session for any CHMT course questions.',
   '2026-05-25', '09:00', 'A000362', 6789012, 31, 60, 4, 'Chem Lab 1', 'Booked', 1),

  ('2026-05-27-00003', 'ELEN4020 - Afternoon Q&A',
   'Open afternoon session. Bring questions on data-intensive computing.',
   '2026-05-27', '14:00', 'A000359', 3456789, 16, 60, 3, 'Lab 3B',     'Booked', 1);

-- ─── Consultation Attendees ───────────────────────────────────────────────────

-- Joinable: 2026-05-19-00001 (capacity 5, 1 attendee → 4 free)
INSERT OR IGNORE INTO consultation_attendees (const_id, student_number) VALUES
  ('2026-05-19-00001', 2345678);

-- Joinable: 2026-05-20-00001 (capacity 5, 2 attendees → 3 free)
INSERT OR IGNORE INTO consultation_attendees (const_id, student_number) VALUES
  ('2026-05-20-00001', 3456789),
  ('2026-05-20-00001', 2345678);

-- Joinable: 2026-05-21-00001 (capacity 3, 1 attendee → 2 free)
INSERT OR IGNORE INTO consultation_attendees (const_id, student_number) VALUES
  ('2026-05-21-00001', 4567890);

-- Joinable: 2026-05-22-00001 (capacity 4, 1 attendee → 3 free)
INSERT OR IGNORE INTO consultation_attendees (const_id, student_number) VALUES
  ('2026-05-22-00001', 5678901);

-- Joinable: 2026-05-26-00001 (capacity 5, 2 attendees → 3 free)
INSERT OR IGNORE INTO consultation_attendees (const_id, student_number) VALUES
  ('2026-05-26-00001', 2345678),
  ('2026-05-26-00001', 3456789);

-- Joinable: 2026-05-27-00001 (capacity 4, 1 attendee → 3 free)
INSERT OR IGNORE INTO consultation_attendees (const_id, student_number) VALUES
  ('2026-05-27-00001', 6789012);

-- Joinable: 2026-05-28-00001 (capacity 4, 1 attendee → 3 free)
INSERT OR IGNORE INTO consultation_attendees (const_id, student_number) VALUES
  ('2026-05-28-00001', 3456789);

-- Joinable: 2026-05-29-00001 (capacity 5, 1 attendee → 4 free)
INSERT OR IGNORE INTO consultation_attendees (const_id, student_number) VALUES
  ('2026-05-29-00001', 4567890);

-- Full: 2026-05-20-00002 (capacity 4, 4 attendees → FULL)
INSERT OR IGNORE INTO consultation_attendees (const_id, student_number) VALUES
  ('2026-05-20-00002', 2345678),
  ('2026-05-20-00002', 3456789),
  ('2026-05-20-00002', 5678901),
  ('2026-05-20-00002', 6789012);

-- Full: 2026-05-27-00002 (capacity 4, 4 attendees → FULL)
INSERT OR IGNORE INTO consultation_attendees (const_id, student_number) VALUES
  ('2026-05-27-00002', 4567890),
  ('2026-05-27-00002', 2345678),
  ('2026-05-27-00002', 3456789),
  ('2026-05-27-00002', 5678901);

-- allow_join=0: 2026-05-19-00002 (1 attendee, join blocked by flag)
INSERT OR IGNORE INTO consultation_attendees (const_id, student_number) VALUES
  ('2026-05-19-00002', 4567890);

-- Empty/fresh: only organiser in attendees
INSERT OR IGNORE INTO consultation_attendees (const_id, student_number) VALUES
  ('2026-05-18-00001', 2345678);

INSERT OR IGNORE INTO consultation_attendees (const_id, student_number) VALUES
  ('2026-05-20-00003', 5678901);

INSERT OR IGNORE INTO consultation_attendees (const_id, student_number) VALUES
  ('2026-05-25-00001', 6789012);

INSERT OR IGNORE INTO consultation_attendees (const_id, student_number) VALUES
  ('2026-05-27-00003', 3456789);

-- ─── Past Consultations for demo student (2434427) ───────────────────────────
-- These all sit before "today" (2026-05-17) so they appear in the Past tab.
-- A mix of attendee-only and organiser sessions across three weeks of history,
-- so the demo video has a believable activity trail.
--   Date            DOW    Lecturer (avail_id)        Role for 2434427
--   2026-04-27 Mon  Clark Kent (1)                    attendee
--   2026-04-30 Thu  Bruce Wayne (10)                  organiser
--   2026-05-05 Tue  Diana Prince (14)                 attendee
--   2026-05-08 Fri  Lois Lane (3)                     organiser
--   2026-05-13 Wed  Steve Rogers (34)                 attendee
--   2026-05-15 Fri  Bruce Wayne (11)                  organiser
INSERT OR IGNORE INTO consultations
  (const_id, consultation_title, consultation_description, consultation_date, consultation_time,
   lecturer_id, organiser, availability_id, duration_min, max_number_of_students, venue, status, allow_join)
VALUES
  ('2026-04-27-00001', 'SD3 - Intro to Scrum',
   'First sprint kickoff Q&A: roles, ceremonies, and definition of done.',
   '2026-04-27', '09:00', 'A000356', 3456789,  1, 60, 4, 'Room 101',  'Booked', 1),

  ('2026-04-30-00001', 'ELEN4009 - Lab Report Help',
   'Walkthrough of the report rubric and common feedback from last year.',
   '2026-04-30', '09:00', 'A000358', 2434427, 10, 60, 3, 'Room 204',  'Booked', 1),

  ('2026-05-05-00001', 'ELEN4020 - DB Modelling Catch-up',
   'Going over ER → relational mapping and 3NF examples.',
   '2026-05-05', '10:00', 'A000359', 4567890, 14, 60, 4, 'Room 207',  'Booked', 1),

  ('2026-05-08-00001', 'ELEN3009 - Signal Processing Revision',
   'Pre-test review: convolution, sampling, and worked exam problems.',
   '2026-05-08', '11:00', 'A000357', 2434427,  3, 60, 5, 'Room 102',  'Booked', 1),

  ('2026-05-13-00001', 'CHMT4009 - Reaction Engineering Q&A',
   'Discussion of batch vs CSTR design problems from tutorial 6.',
   '2026-05-13', '09:00', 'A000362', 6789012, 34, 60, 4, 'Chem Lab 2','Booked', 1),

  ('2026-05-15-00001', 'SD3 - Sprint 2 Retro Prep',
   'Aligning on retro talking points and velocity calculation.',
   '2026-05-15', '10:00', 'A000358', 2434427, 11, 60, 5, 'Room 205',  'Booked', 1);

-- Demo student is an attendee on all six past consultations.
INSERT OR IGNORE INTO consultation_attendees (const_id, student_number) VALUES
  ('2026-04-27-00001', 2434427),
  ('2026-04-27-00001', 3456789),
  ('2026-04-30-00001', 2434427),
  ('2026-05-05-00001', 2434427),
  ('2026-05-05-00001', 4567890),
  ('2026-05-08-00001', 2434427),
  ('2026-05-08-00001', 3456789),
  ('2026-05-13-00001', 2434427),
  ('2026-05-13-00001', 6789012),
  ('2026-05-15-00001', 2434427);

-- ─── Demo cancellation notice ────────────────────────────────────────────────
-- Pre-seeds one upcoming consultation that an organiser has already cancelled
-- but where the demo student is still an attendee. This drives the new "your
-- consultation was cancelled" banner on the student dashboard.
INSERT OR IGNORE INTO consultations
  (const_id, consultation_title, consultation_description, consultation_date, consultation_time,
   lecturer_id, organiser, availability_id, duration_min, max_number_of_students, venue, status, allow_join)
VALUES
  ('2026-05-21-00099', 'ELEN4020 - Group Study Session',
   'Pre-test group study (organiser cancelled last minute).',
   '2026-05-21', '10:00', 'A000359', 3456789, 17, 60, 4, 'Room 209', 'Cancelled', 1);

INSERT OR IGNORE INTO consultation_attendees (const_id, student_number) VALUES
  ('2026-05-21-00099', 2434427),
  ('2026-05-21-00099', 3456789);

-- ─── Demo failed-login activity ──────────────────────────────────────────────
-- Surfaces the admin "Failed Logins" sidebar link (only renders when at least
-- one AUTH_FAILED_LOGIN row exists). Mix of genuine forgot-password attempts
-- on real accounts and unknown-identifier attempts that look like probing.
-- action_id 14 == AUTH_FAILED_LOGIN per seedVitalInfo.sql line 329.
INSERT OR IGNORE INTO activity_log (user_id, action_id, created_at) VALUES
  ('2434427', 14, '2026-05-14 08:42:11'),  -- demo student, single fat-finger
  ('3456789', 14, '2026-05-15 19:03:55'),  -- another student, single
  ('A000358', 14, '2026-05-15 21:18:02'),  -- lecturer, single
  ('9999999', 14, '2026-05-16 02:14:37'),  -- unknown identifier, looks like probing
  ('9999999', 14, '2026-05-16 02:14:48'),  -- repeat from same identifier
  ('2345678', 14, '2026-05-16 16:50:21'),  -- attempt 1 of 4
  ('2345678', 14, '2026-05-16 16:50:34'),  -- attempt 2 of 4
  ('2345678', 14, '2026-05-16 16:50:46'),  -- attempt 3 of 4
  ('2345678', 14, '2026-05-16 16:51:02');  -- attempt 4 of 4 (PIN lockout)

-- Mirror entries in failed_login_log so the two log paths stay consistent.
-- The 4th attempt for 2345678 triggers the PIN lockout (pin_triggered = 1).
INSERT OR IGNORE INTO failed_login_log (identifier, attempted_at, pin_triggered) VALUES
  ('2434427', '2026-05-14 08:42:11', 0),
  ('3456789', '2026-05-15 19:03:55', 0),
  ('A000358', '2026-05-15 21:18:02', 0),
  ('9999999', '2026-05-16 02:14:37', 0),
  ('9999999', '2026-05-16 02:14:48', 0),
  ('2345678', '2026-05-16 16:50:21', 0),
  ('2345678', '2026-05-16 16:50:34', 0),
  ('2345678', '2026-05-16 16:50:46', 0),
  ('2345678', '2026-05-16 16:51:02', 1);

-- Reflect the lockout state on Thabo's actual student row so it shows up in
-- the admin Students table (failed_attempts = 4, login_pin = sha256('482913')).
-- The PIN itself is a literal demo value; in production it is generated by
-- auth-controller and emailed to the student. Lockout clears once the
-- correct PIN is entered on /login/pin.
UPDATE students
   SET failed_attempts = 4,
       login_pin = '4dc7c5c6f7c5cd4f8c9e9d6d1f0e6dc6e2a7c3a6f9b4a3d1e2f8c5b9a7d3e6c1'
 WHERE student_number = 2345678;
