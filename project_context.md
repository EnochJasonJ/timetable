# Project Context: AI-Powered Timetable Scheduler

## 1. Overview
The **Timetable Scheduler** is a sophisticated Academic Institution Management system designed to autonomously generate conflict-free schedules using a **Genetic Algorithm (GA)**. It manages academic entities (Departments, Programs, Faculty, Rooms) and produces optimized timetables that adhere to complex institutional constraints like lab continuity, faculty availability, and room capacity.

The project recently underwent a migration from a monolithic Django architecture to a modern, decoupled **React + Django REST Framework** SPA.

---

## 2. Tech Stack

### Backend (Django 5.x)
- **Framework:** Django REST Framework (DRF).
- **Authentication:** JWT (JSON Web Tokens) via `djangorestframework-simplejwt`.
- **Background Tasks:** Celery + Redis (handles long-running GA computations).
- **API Style:** RESTful with role-based endpoint protection.

### Frontend (React 18)
- **Build Tool:** Vite.
- **Styling:** TailwindCSS (modern, responsive design).
- **Icons:** Lucide React.
- **Data Fetching:** Axios with JWT Interceptors for automatic token refreshing.
- **Routing:** React Router DOM (Protected Routes).

### Infrastructure & Persistence
- **Primary Database:** PostgreSQL (Production-grade relational DB).
- **Caching/Broker:** Redis (Used for Celery task queuing and dashboard performance caching).
- **Environment:** Docker-ready (Postgres and Redis services).

---

## 3. Core Architectural Modules

### A. The Genetic Algorithm (GA) Engine (`TTS/SchedulerApp/services.py`)
The "brain" of the system. It evolves a population of potential schedules over hundreds of generations.
- **Constraint Handling:** 
    - **Hard Constraints:** Room double-booking, Faculty clashes, Section overlaps.
    - **Soft Constraints:** Gaps in student schedules, consecutive lab blocks (preventing labs from splitting across lunch breaks).
- **Fitness Function:** 
    - Scores schedules from 0.0 to 1.0. 
    - Penalizes gaps, room capacity mismatches (based on section strength), and venue mismatches (theory in labs, etc.).
- **Lab Logic:** Supports subjects spanning multiple consecutive slots while maintaining block integrity.

### B. Role-Based Access Control (RBAC)
The system enforces security at both the **API level** (Django permissions) and **UI level** (React filtering).
- **Roles:**
    - `SUPER_ADMIN`: Full institutional control.
    - `TIMETABLE_ADMIN`: Manage schedules and infrastructure.
    - `HOD` (Head of Dept): Manage departmental data and trigger generations.
    - `FACULTY`: View-only access to master grids and personal schedules.
    - `STUDENT`: View-only access to section-specific timetables.

### C. Asynchronous Task Workflow
1. User triggers generation in the React UI.
2. Django initiates a `run_generation_task` via **Celery**.
3. The task ID is stored in **Redis Cache**.
4. The frontend polls a progress endpoint (`/api/v1/timetables/progress/`).
5. Upon completion, the task saves results to Postgres and updates the cache with the new Timetable IDs for redirection.

---

## 4. Data Model Summary
- **Academic Structure:** `Department` > `Program` > `Section`.
- **Curriculum:** `Subject` (Theory/Lab) mapped via `CourseOffering` to specific `Sections` and `Faculty`.
- **Infrastructure:** `Room` (Classroom/Lab) and `TimeSlot` (Fixed institutional periods).
- **Result:** `Timetable` contains multiple `TimetableEntry` records (linking Offering + Room + Slot).

---

## 5. Key UI Features
- **Dashboard:** Real-time statistics, recent activity feed, and a conflict summary (cached for performance).
- **Master Timetable:** A consolidated institutional view allowing grouping by Section, Faculty, or Room.
- **Interactive Generation:** A configuration hub to tune GA parameters (e.g., number of generations) with real-time visual progress tracking.
- **Data Management:** Full CRUD interfaces for all academic and infrastructure entities.
- **Exports:** Timetables can be exported as **PDF**, **CSV**, or **XLS**.

---

## 6. Setup & Operations

### Prerequisites
- Python 3.10+
- Node.js 18+
- Docker (for Redis/Postgres)

### Running the Services
1. **Docker:** `docker run` Postgres and Redis.
2. **Backend:** `python manage.py runserver` (Terminal 1).
3. **Worker:** `celery -A Scheduler worker` (Terminal 2).
4. **Frontend:** `npm run dev` (Terminal 3).

---

## 7. Recent Improvements & Bug Fixes
- **Security:** Implemented `IsAdminOrHOD` permissions to block students from administrative APIs.
- **Persistence:** Moved `GENERATION_STATE` from volatile memory to Redis Cache.
- **Scalability:** Migrated from SQLite to PostgreSQL and from threading to Celery.
- **Logic:** Fixed "Lab Overflow" by strictly enforcing day boundary checks during random slot assignment in the GA.
- **UI:** Implemented sidebar filtering so users only see links relevant to their role.
