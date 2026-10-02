# AI Timetable Agent

A final-year CSE project that uses a **single AI agent** powered by **OR-Tools CP-SAT** to automatically generate optimized, conflict-free academic timetables from user-defined constraints.

---

## Problem Statement

Manual timetable scheduling in academic institutions is time-consuming, error-prone, and difficult to optimize across multiple constraints (teacher availability, room capacities, session frequencies). This project automates that process using constraint programming.

---

## Solution Approach

A single-level AI agent orchestrates the entire pipeline:

```
User Input (constraints)
        │
        ▼
┌───────────────────────────────────────┐
│           AI Timetable Agent          │
│                                       │
│  1. Input Analysis                    │
│  2. NL Constraint Parsing (regex/NLP) │
│  3. Hard Constraint Validation        │
│  4. Teacher Availability Check        │
│  5. Classroom Availability Check      │
│  6. OR-Tools CP-SAT Optimization      │
│  7. Post-generation Conflict Check    │
│  8. Retry if hard conflicts found     │
│  9. Format & Return Response          │
└───────────────────────────────────────┘
        │
        ▼
  Structured Timetable (saved to MySQL)
        │
        ▼
  React Frontend Display
```

---

## Features

- ✅ OR-Tools CP-SAT constraint programming solver
- ✅ Hard constraints: teacher/classroom conflicts, availability, session counts, lab rooms
- ✅ Soft constraints: session spread across days, no back-to-back teaching
- ✅ Natural language constraint input (regex/keyword-based, no paid APIs)
- ✅ JWT authentication
- ✅ CRUD for teachers, subjects, classrooms, classes, divisions
- ✅ Availability grid editor (teacher & classroom)
- ✅ Subject-teacher-division requirement mapping
- ✅ Export to PDF and Excel
- ✅ Conflict report
- ✅ NL-driven timetable modification and regeneration

---

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 18, React Router v6, Axios    |
| Backend   | Python Flask 3, Flask-JWT-Extended  |
| Database  | MySQL 8                             |
| Solver    | Google OR-Tools CP-SAT (ortools)    |
| Export    | ReportLab (PDF), openpyxl (Excel)   |

---

## Database Schema

| Table                  | Description                              |
|------------------------|------------------------------------------|
| `users`                | Authentication                           |
| `teachers`             | Teacher records                          |
| `subjects`             | Subject catalog                          |
| `classes`              | Academic classes (e.g. TY CSE)          |
| `divisions`            | Divisions within a class (A, B)          |
| `classrooms`           | Room/lab inventory                       |
| `teacher_availability` | Per-teacher slot availability (day×slot) |
| `classroom_availability`| Per-room slot availability              |
| `subject_requirements` | Maps subject+teacher to division+count   |
| `timetable`            | Generated timetable header               |
| `timetable_entries`    | Normalized timetable rows (no JSON)      |
| `generation_logs`      | Agent step audit trail                   |

---

## Installation

### Prerequisites

- Python 3.10+
- Node.js 18+
- MySQL 8

### 1. MySQL Setup

```sql
mysql -u root -p < database/schema.sql
mysql -u root -p ai_timetable_agent < database/seed.sql
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your MySQL credentials

python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

---

## How to Run

**Terminal 1 – Backend:**
```bash
cd backend
# (activate venv)
python app.py
# Runs on http://localhost:5000
```

**Terminal 2 – Frontend:**
```bash
cd frontend
npm start
# Runs on http://localhost:3000
```

Open `http://localhost:3000` and login with:
- **Username:** `admin`
- **Password:** `admin123`

---

## API Documentation

| Method | Endpoint                              | Description                  |
|--------|---------------------------------------|------------------------------|
| POST   | `/api/auth/login`                     | Login, get JWT               |
| POST   | `/api/auth/register`                  | Register new user            |
| GET    | `/api/teachers/`                      | List teachers                |
| POST   | `/api/teachers/`                      | Create teacher               |
| PUT    | `/api/teachers/:id`                   | Update teacher               |
| DELETE | `/api/teachers/:id`                   | Delete teacher               |
| GET    | `/api/teachers/:id/availability`      | Get availability grid        |
| PUT    | `/api/teachers/:id/availability`      | Set availability grid        |
| GET    | `/api/subjects/`                      | List subjects                |
| GET    | `/api/classrooms/`                    | List classrooms              |
| GET    | `/api/divisions/classes`              | List classes                 |
| GET    | `/api/divisions/`                     | List divisions               |
| GET    | `/api/divisions/:id/requirements`     | Get requirements for division|
| POST   | `/api/divisions/:id/requirements`     | Set requirement              |
| POST   | `/api/agent/generate`                 | **Run AI agent, generate TT**|
| POST   | `/api/agent/analyze`                  | Analyze NL input only        |
| GET    | `/api/timetables/`                    | List timetables              |
| GET    | `/api/timetables/:id`                 | Get timetable + entries      |
| GET    | `/api/timetables/:id/export/pdf`      | Download PDF                 |
| GET    | `/api/timetables/:id/export/excel`    | Download Excel               |
| DELETE | `/api/timetables/:id`                 | Delete timetable             |

---

## Agent Generate – Example Request

```json
POST /api/agent/generate
{
  "class_id": 1,
  "division_ids": [1, 2],
  "nl_input": "Prof. Sharma not available on Friday. ML needs 2 sessions per week.",
  "name": "TY CSE Semester 5",
  "time_limit": 60
}
```

## Agent Generate – Example Response

```json
{
  "status": "success",
  "message": "Timetable generated successfully",
  "optimization_score": 94.5,
  "conflicts": [],
  "timetable_id": 3,
  "agent_steps": [
    { "step": "Input Analysis",          "status": "success", "message": "Received 12 requirements…" },
    { "step": "Natural Language Parsing","status": "success", "message": "Identified 2 constraint(s)…" },
    { "step": "CP-SAT Optimization",     "status": "success", "message": "Solver completed. 30 assignments." }
  ],
  "divisions": [
    {
      "division_id": 1,
      "division_name": "A",
      "timetable": [
        {
          "day": "Monday",
          "time_slot": "10:00-12:00",
          "subject": "Database Management Systems",
          "teacher": "Prof. Sharma",
          "classroom": "Room 101"
        }
      ]
    }
  ]
}
```

---

## Schedule Structure

| Period | Time              | Type        |
|--------|-------------------|-------------|
| 1      | 10:00 AM – 12:00 PM | Teachable |
| –      | 12:00 PM – 12:40 PM | **BREAK** |
| 2      | 12:40 PM – 2:40 PM  | Teachable |
| –      | 2:40 PM – 2:50 PM   | **BREAK** |
| 3      | 2:50 PM – 4:50 PM   | Teachable |

---

## Future Scope

- Multi-semester timetable generation
- Elective subject handling
- Faculty load balancing reports
- Email notifications for schedule changes
- Mobile-responsive PWA
- Google Calendar integration
- Historical analytics and conflict trends
