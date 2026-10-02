-- AI Timetable Agent - Seed Data
USE ai_timetable_agent;

-- ──────────────────────────────────────────────
-- Default admin user  (password: admin123)
-- bcrypt hash generated offline
-- ──────────────────────────────────────────────
INSERT INTO users (username, email, password, role) VALUES
('admin', 'admin@timetable.local',
 '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36r5RUPCDm2LJ.RsXoMZHYa', 'admin');

-- ──────────────────────────────────────────────
-- Teachers
-- ──────────────────────────────────────────────
INSERT INTO teachers (id, name, email, department, max_hours) VALUES
(1, 'Prof. Sharma',  'sharma@college.edu',  'CSE', 20),
(2, 'Prof. Patil',   'patil@college.edu',   'CSE', 18),
(3, 'Prof. Joshi',   'joshi@college.edu',   'CSE', 20),
(4, 'Prof. More',    'more@college.edu',    'CSE', 16),
(5, 'Prof. Desai',   'desai@college.edu',   'CSE', 20),
(6, 'Prof. Kulkarni','kulkarni@college.edu','CSE', 18);

-- ──────────────────────────────────────────────
-- Subjects
-- ──────────────────────────────────────────────
INSERT INTO subjects (id, name, code, is_lab, sessions_per_week) VALUES
(1, 'Database Management Systems', 'DBMS',  0, 3),
(2, 'Computer Networks',           'CN',    0, 3),
(3, 'Machine Learning',            'ML',    0, 3),
(4, 'Internet of Things',          'IoT',   0, 3),
(5, 'Operating Systems',           'OS',    0, 3),
(6, 'Software Engineering',        'SE',    0, 3);

-- ──────────────────────────────────────────────
-- Class
-- ──────────────────────────────────────────────
INSERT INTO classes (id, name, year, department) VALUES
(1, 'TY CSE', 'Third Year', 'Computer Science & Engineering');

-- ──────────────────────────────────────────────
-- Divisions
-- ──────────────────────────────────────────────
INSERT INTO divisions (id, class_id, name, strength) VALUES
(1, 1, 'A', 60),
(2, 1, 'B', 58);

-- ──────────────────────────────────────────────
-- Classrooms
-- ──────────────────────────────────────────────
INSERT INTO classrooms (id, name, capacity, is_lab) VALUES
(1, 'Room 101', 65, 0),
(2, 'Room 102', 65, 0),
(3, 'Room 103', 65, 0),
(4, 'Lab 1',    40, 1),
(5, 'Room 104', 65, 0);

-- ──────────────────────────────────────────────
-- Teacher Availability
-- All teachers available all slots by default (day 0-4, slot 0-2)
-- ──────────────────────────────────────────────
INSERT INTO teacher_availability (teacher_id, day, slot, available)
SELECT t.id, d.day, s.slot, 1
FROM teachers t
CROSS JOIN (SELECT 0 day UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4) d
CROSS JOIN (SELECT 0 slot UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5) s;

-- Make Prof. More unavailable on Fridays slot 0
UPDATE teacher_availability SET available = 0
WHERE teacher_id = 4 AND day = 4 AND slot = 0;

-- Make Prof. Desai unavailable on Monday slot 2
UPDATE teacher_availability SET available = 0
WHERE teacher_id = 5 AND day = 0 AND slot = 2;

-- ──────────────────────────────────────────────
-- Classroom Availability
-- All rooms available all slots by default
-- ──────────────────────────────────────────────
INSERT INTO classroom_availability (classroom_id, day, slot, available)
SELECT c.id, d.day, s.slot, 1
FROM classrooms c
CROSS JOIN (SELECT 0 day UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4) d
CROSS JOIN (SELECT 0 slot UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5) s;

-- ──────────────────────────────────────────────
-- Subject Requirements
-- Division A:  Sharma→DBMS, Patil→CN, Joshi→ML,  More→IoT, Desai→OS, Kulkarni→SE
-- Division B:  Sharma→DBMS, Patil→CN, Joshi→ML,  More→IoT, Desai→OS, Kulkarni→SE
-- (same teachers, different division - shared resource constraints apply)
-- ──────────────────────────────────────────────
INSERT INTO subject_requirements (division_id, subject_id, teacher_id, sessions_per_week) VALUES
-- Division A
(1, 1, 1, 3),  -- DBMS   → Prof. Sharma
(1, 2, 2, 3),  -- CN     → Prof. Patil
(1, 3, 3, 3),  -- ML     → Prof. Joshi
(1, 4, 4, 3),  -- IoT    → Prof. More
(1, 5, 5, 3),  -- OS     → Prof. Desai
(1, 6, 6, 3),  -- SE     → Prof. Kulkarni
-- Division B
(2, 1, 1, 3),  -- DBMS   → Prof. Sharma
(2, 2, 2, 3),  -- CN     → Prof. Patil
(2, 3, 3, 3),  -- ML     → Prof. Joshi
(2, 4, 4, 3),  -- IoT    → Prof. More
(2, 5, 5, 3),  -- OS     → Prof. Desai
(2, 6, 6, 3);  -- SE     → Prof. Kulkarni
