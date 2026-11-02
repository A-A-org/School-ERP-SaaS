# School ERP SaaS

A multi-school management platform designed to help educational institutions manage students, teachers, classes, attendance, finance, exams, results, employees, and daily school operations from one centralized system.

The project uses a **Django REST API backend** and a **React + Vite frontend**, with a modern dashboard interface built using **Shadcn UI** and **Tailwind CSS**.

---

## Project Overview

School ERP SaaS is designed as a scalable school management system that can support multiple schools from a single platform.

The system provides different access levels for platform owners, school administrators, teachers, and accountants.

Each role can access only the information and functionality relevant to their responsibilities.

---

## Main Features

### Dashboard

- School performance overview
- Student statistics
- Teacher statistics
- Class statistics
- Attendance overview
- New enrollment statistics
- Fee collection overview
- Upcoming exams
- Academic year and semester selection

### School Management

- Create schools
- View school profiles
- Edit school information
- Delete eligible schools
- View students by school
- View teachers by school
- View classes by school
- School-level statistics

### Student Management

- Add students
- Edit student information
- Delete students
- Search students
- Assign students to schools
- Assign students to classes
- Store parent/guardian information
- View student profiles

### Student 360

Each student can have additional information including:

#### Parent Information

- Father name
- Mother name
- Guardian phone
- Occupation

#### Medical Information

- Blood group
- Allergies
- Medical notes

#### Emergency Contact

- Contact name
- Relationship
- Phone number

#### Documents

- Student documents
- Document name
- File upload
- Upload history

### Teacher Management

- Teacher accounts
- Teacher-school assignment
- Teacher-class assignment
- Role-based access

### Academic Management

- Classes
- Sections
- Subjects
- Exams
- Results

### Attendance

- Student attendance
- Attendance history
- Attendance statistics
- School attendance overview

### Finance

- Student fees
- Fee collection
- Financial records
- School finance overview

### Employees

- Employee management
- School employee records

### Notifications

- School notifications
- System notifications

### Reports

- School performance reports
- Student reports
- Attendance reports
- Financial reports

---

## User Roles

The platform currently supports several user roles.

### Platform Owner

The Platform Owner has system-wide access.

Permissions include:

- Manage all schools
- View all students
- Manage school information
- Manage users
- Access system-wide statistics
- Delete schools when allowed

### School Admin

A School Admin manages their assigned school.

Permissions include:

- Manage students
- Manage school information
- Manage classes
- View teachers
- Manage Student 360 information
- Access school-level data

### Teacher

Teachers have restricted access.

They can access students assigned to their classroom and use relevant academic and attendance functionality.

### Accountant

Accountants can access students and financial information associated with their school.

---

## Technology Stack

### Frontend

- React
- TypeScript
- Vite
- Shadcn UI
- Tailwind CSS
- Lucide React
- React Router

### Backend

- Python
- Django 6.1.1
- Django REST Framework
- JWT Authentication

### Database

- PostgreSQL

---

## Project Structure

```text
School-ERP-SaaS/
│
├── backend/
│   ├── accounts/
│   ├── academics/
│   ├── attendance/
│   ├── audit_logs/
│   ├── config/
│   ├── employees/
│   ├── finance/
│   ├── notifications/
│   ├── schools/
│   ├── students/
│   └── manage.py
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── lib/
│   │   ├── routes/
│   │   ├── types/
│   │   └── views/
│   │       ├── attendance/
│   │       ├── auth/
│   │       ├── classes/
│   │       ├── dashboards/
│   │       ├── finance/
│   │       ├── schools/
│   │       ├── students/
│   │       └── teachers/
│   │
│   ├── package.json
│   └── vite.config.ts
│
├── database/
├── documentation/
└── README.md
```

---

## API Structure

Some of the main API endpoints include:

```text
/api/accounts/
/api/accounts/me/

/api/schools/

/api/students/

/api/academics/classes/

/api/attendance/

/api/finance/
```

### Student 360 API

Student 360 functionality includes dedicated endpoints for additional student information.

```text
GET /api/students/{id}/
```

### Parent Information

```text
GET   /api/students/{id}/parent/
PATCH /api/students/{id}/parent/
```

### Medical Information

```text
GET   /api/students/{id}/medical/
PATCH /api/students/{id}/medical/
```

### Emergency Contact

```text
GET   /api/students/{id}/emergency/
PATCH /api/students/{id}/emergency/
```

### Student Documents

```text
GET    /api/students/{id}/documents/
POST   /api/students/{id}/documents/
DELETE /api/students/{id}/documents/{document_id}/
```

---

## Authentication

The system uses JWT-based authentication.

Protected API requests require an authenticated user.

The frontend handles access and refresh tokens and communicates with the Django REST API.

---

# Running the Project

## Backend

Move into the backend directory:

```bash
cd backend
```

Activate the virtual environment on Windows:

```powershell
venv\Scripts\Activate.ps1
```

Run the Django development server:

```bash
python manage.py runserver
```

The backend will normally run at:

```text
http://127.0.0.1:8000/
```

---

## Frontend

Move into the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will normally run at:

```text
http://localhost:5173/
```

If localhost binding causes issues on Windows, the frontend can also be started using:

```bash
npm run dev -- --host 127.0.0.1 --port 5173
```

Then open:

```text
http://127.0.0.1:5173/
```

---

## Development Setup

For local development, both servers should run at the same time.

### Terminal 1

```bash
cd backend
venv\Scripts\Activate.ps1
python manage.py runserver
```

### Terminal 2

```bash
cd frontend
npm run dev
```

---

## Current Development Status

The project is actively under development.

### Implemented

- Authentication
- Role-based access
- Dashboard
- School management
- Student management
- School detail pages
- Student search
- Student add/edit/delete
- Student-school assignment
- Student-class assignment
- Student 360 backend structure
- Parent information
- Medical information
- Emergency contact
- Student documents API
- Django REST API integration

### In Progress

- Full Student 360 frontend
- Student document upload interface
- Attendance integration
- Finance integration
- Exam and results management
- Reporting
- Dashboard analytics improvements

---

## Security and Permissions

The project uses role-based access control.

Examples:

- Platform Owners can access all schools.
- School Admins are restricted to their assigned school.
- Teachers can access students assigned to their classroom.
- Accountants can access relevant school and financial records.

Sensitive Student 360 information is also protected using backend permissions.

---

## UI Template

The frontend is based on the open-source **Shadcn Dashboard** template.

The original template is provided by:

[Shadcn Dashboard](https://shadcndashboard.dev/)

The dashboard template is licensed under the MIT License.

The original template has been customized and extended for the School ERP SaaS platform.

---

## License

This project uses open-source libraries and components under their respective licenses.

The Shadcn Dashboard frontend template is licensed under the MIT License.

---

## Project Goal

The goal of School ERP SaaS is to provide schools with a centralized, scalable, and easy-to-use platform for managing academic, administrative, financial, and student-related operations.

The system is designed so that one platform can support multiple schools while keeping each school's data and permissions properly separated.
