-- AI Timetable Agent - Database Schema
-- Run: mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS ai_timetable_agent CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ai_timetable_agent;

-- ──────────────────────────────────────────────
-- Users (authentication)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    username    VARCHAR(100) NOT NULL UNIQUE,
    email       VARCHAR(150) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    role        ENUM('admin','viewer') NOT NULL DEFAULT 'admin',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ──────────────────────────────────────────────
-- Teachers
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teachers (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(150) NOT NULL,
    email        VARCHAR(150) UNIQUE,
    department   VARCHAR(100),
    max_hours    INT NOT NULL DEFAULT 20,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ──────────────────────────────────────────────
-- Subjects
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subjects (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(150) NOT NULL,
    code          VARCHAR(20)  NOT NULL UNIQUE,
    is_lab        TINYINT(1)   NOT NULL DEFAULT 0,
    sessions_per_week INT NOT NULL DEFAULT 3,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ──────────────────────────────────────────────
-- Classes  (e.g. "TY CSE")
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS classes (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    year        VARCHAR(20),
    department  VARCHAR(100),
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ──────────────────────────────────────────────
-- Divisions  (e.g. "A", "B" under TY CSE)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS divisions (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    class_id    INT NOT NULL,
    name        VARCHAR(10) NOT NULL,
    strength    INT DEFAULT 60,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    UNIQUE KEY uq_class_division (class_id, name)
);

-- ──────────────────────────────────────────────
-- Classrooms
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS classrooms (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    capacity    INT DEFAULT 60,
    is_lab      TINYINT(1) NOT NULL DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ──────────────────────────────────────────────
-- Teacher Availability
-- day: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri
-- slot: 0=10:00-12:00, 1=12:40-2:40, 2=2:50-4:50
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teacher_availability (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id  INT NOT NULL,
    day         TINYINT NOT NULL COMMENT '0=Mon…4=Fri',
    slot        TINYINT NOT NULL COMMENT '0=slot1,1=slot2,2=slot3',
    available   TINYINT(1) NOT NULL DEFAULT 1,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    UNIQUE KEY uq_teacher_avail (teacher_id, day, slot)
);

-- ──────────────────────────────────────────────
-- Classroom Availability
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS classroom_availability (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    classroom_id INT NOT NULL,
    day          TINYINT NOT NULL,
    slot         TINYINT NOT NULL,
    available    TINYINT(1) NOT NULL DEFAULT 1,
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE,
    UNIQUE KEY uq_classroom_avail (classroom_id, day, slot)
);

-- ──────────────────────────────────────────────
-- Subject Requirements  (which teacher teaches
-- which subject for which division)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subject_requirements (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    division_id  INT NOT NULL,
    subject_id   INT NOT NULL,
    teacher_id   INT NOT NULL,
    sessions_per_week INT NOT NULL DEFAULT 3,
    FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id)  REFERENCES subjects(id)  ON DELETE CASCADE,
    FOREIGN KEY (teacher_id)  REFERENCES teachers(id)  ON DELETE CASCADE,
    UNIQUE KEY uq_req (division_id, subject_id)
);

-- ──────────────────────────────────────────────
-- Timetable header (one per generation run)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS timetable (
    id                 INT AUTO_INCREMENT PRIMARY KEY,
    name               VARCHAR(200) NOT NULL,
    class_id           INT NOT NULL,
    status             ENUM('generated','saved','archived') DEFAULT 'generated',
    optimization_score DECIMAL(5,2) DEFAULT 0,
    conflicts_count    INT DEFAULT 0,
    created_by         INT,
    created_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id)    REFERENCES classes(id)   ON DELETE CASCADE,
    FOREIGN KEY (created_by)  REFERENCES users(id)
);

-- ──────────────────────────────────────────────
-- Timetable Entries (normalized, no JSON blobs)
-- day: 0=Mon…4=Fri  |  slot: 0,1,2  (breaks excluded)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS timetable_entries (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    timetable_id   INT NOT NULL,
    division_id    INT NOT NULL,
    day            TINYINT NOT NULL,
    slot           TINYINT NOT NULL,
    subject_id     INT NOT NULL,
    teacher_id     INT NOT NULL,
    classroom_id   INT NOT NULL,
    FOREIGN KEY (timetable_id)  REFERENCES timetable(id)   ON DELETE CASCADE,
    FOREIGN KEY (division_id)   REFERENCES divisions(id)   ON DELETE CASCADE,
    FOREIGN KEY (subject_id)    REFERENCES subjects(id)    ON DELETE CASCADE,
    FOREIGN KEY (teacher_id)    REFERENCES teachers(id)    ON DELETE CASCADE,
    FOREIGN KEY (classroom_id)  REFERENCES classrooms(id)  ON DELETE CASCADE,
    UNIQUE KEY uq_entry (timetable_id, division_id, day, slot)
);

-- ──────────────────────────────────────────────
-- Generation Logs  (agent step tracing)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS generation_logs (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    timetable_id INT,
    step_name    VARCHAR(200) NOT NULL,
    status       ENUM('success','warning','error') DEFAULT 'success',
    message      TEXT,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (timetable_id) REFERENCES timetable(id) ON DELETE SET NULL
);
