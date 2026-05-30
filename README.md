# Smart Campus Digital System

A full-stack web application for managing campus operations, built with the **MERN stack** (React.js, Node.js + Express, SQLite).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, Tailwind CSS 3, React Router 7 |
| Backend | Node.js, Express 4 |
| Database | SQLite via better-sqlite3 |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| File Upload | Multer |
| Charts | Recharts |
| HTTP Client | Axios |
| Icons | Lucide React |

## Project Structure

```
smart-campus-digital-system/
├── backend/
│   ├── controllers/        # Route handlers / business logic
│   ├── db/
│   │   ├── database.js     # DB initialization & schema
│   │   └── seed.js         # Seed data script
│   ├── middleware/
│   │   └── auth.js         # JWT authentication middleware
│   ├── routes/             # Express route definitions
│   ├── uploads/
│   │   └── lost-found/     # Uploaded item images
│   ├── campus.db           # SQLite database (auto-generated)
│   ├── index.js            # Server entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # Shared UI components
│   │   ├── context/        # Auth context/provider
│   │   ├── pages/          # Page components by role
│   │   │   ├── admin/      # Admin dashboard & management
│   │   │   ├── faculty/    # Faculty pages
│   │   │   └── student/    # Student pages
│   │   ├── utils/          # Axios instance & interceptors
│   │   ├── App.jsx         # Route definitions
│   │   └── main.jsx        # Entry point
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
└── README.md
```

---

## Features

### 1. Authentication (Role-Based)

Three user roles with role-specific login:

| Role | Login Identifier | Example |
|------|-----------------|---------|
| **Student** | Register Number | `21CSE001` |
| **Faculty/Staff** | Staff ID | `FAC001` |
| **Admin** | Email | `admin@campus.com` |

- Field-specific error messages (e.g. "Invalid Register Number" vs "Invalid Password")
- Register Number validated as alphanumeric (8-12 characters)
- JWT token with 7-day expiry
- Role-based route protection on frontend and backend

### 2. Role Dashboards

**Admin**: System-wide management with statistics dashboard.

**Faculty**: View assigned subjects, mark attendance, enter marks, post notices.

**Student**: View personal timetable, attendance percentage, marks/grades, notices.

### 3. Classroom Status

Real-time classroom lookup. Search any room number to see:
- Currently running class (subject, faculty, time, section) with green badge
- "Classroom Available" status with gray badge when free
- Upcoming classes for the rest of the day

### 4. Campus Navigation

Searchable campus map with SVG-based visual layout:
- **Places**: 30+ seeded locations (classrooms, labs, offices, hostels, facilities)
- **Autocomplete search**: Real-time suggestions as you type
- **Location detail**: Block, floor, landmark hint, step-by-step directions from Main Gate
- **SVG Campus Map**: Coloured blocks, dashed path to destination, pulsing marker
- **Recent Searches**: Saved per user, clickable chips to re-search

### 5. Lost & Found

Community-driven lost item reporting and recovery:

**Posting**: Report lost or found items with photo upload, category, location, date, description.

**Browsing**: Two tabs (Lost / Found), search by name, filter by category, status badges (Active / Claimed / Expired).

**Claiming**: "This is Mine" button opens claim modal with proof description and optional proof image.

**Claim Management**: Item posters can view all claims with proof, approve (auto-rejects others, reveals claimant contact) or reject.

**Admin Panel**: View all items and claims with proof image viewer, deactivate inappropriate posts.

**Auto-Expiry**: Items automatically marked as Expired after 30 days (checked on server startup).

### 6. Timetable Management (Admin)

Full CRUD with history preservation:
- Add, edit, and deactivate timetable entries
- **Soft updates**: Editing marks old record inactive and inserts a new one — full history retained
- **History view**: Timeline of all changes for any classroom
- Toggle to show inactive entries
- CSV export
- Search by subject, room, or faculty

### 7. Attendance & Marks

**Faculty**: Mark Present/Absent/Late per subject and date. Enter exam scores (Mid/Final/Assignment).

**Student**: View per-subject attendance percentage with colour-coded progress bars. View marks with letter grades.

**Admin**: Attendance and marks summary reports with Recharts bar and line charts.

### 8. Notices

- Post notices with category (Exam/Event/Holiday/General) and target role (all/student/faculty)
- Role-filtered visibility
- Admin can delete; faculty can create without deleting

### 9. History Preservation

No table in the system uses hard DELETE. All records are soft-deleted or status-updated:

| Table | Preservation Method |
|-------|-------------------|
| `timetable` | `is_active` flag + `deactivated_at` timestamp |
| `navigation_history` | `is_hidden` flag |
| `lost_found_items` | `status` field (Active/Claimed/Expired) |
| `lost_found_claims` | `status` field (Pending/Approved/Rejected) |
| `users` | `active` flag |

---

## Database Schema

### Users
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER | PK |
| name | TEXT | |
| email | TEXT | UNIQUE |
| password | TEXT | bcrypt hashed |
| role | TEXT | admin / faculty / student |
| department | TEXT | |
| phone | TEXT | |
| register_number | TEXT | UNIQUE — students only |
| staff_id | TEXT | UNIQUE — faculty/admin |
| active | INTEGER | 1 = active, 0 = deactivated |
| created_at | TEXT | |

### Timetable
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER | PK |
| subject_id | INTEGER | FK → subjects |
| day | TEXT | Monday–Friday |
| start_time | TEXT | HH:MM format |
| end_time | TEXT | HH:MM format |
| room | TEXT | Classroom number |
| semester | INTEGER | |
| faculty_name | TEXT | Denormalized for history |
| department | TEXT | |
| section | TEXT | e.g. CSE-A |
| is_active | INTEGER | 1 = active, 0 = historical |
| deactivated_at | TEXT | Timestamp when deactivated |
| updated_by | INTEGER | FK → users |

Full schema reference in `backend/db/database.js`.

### Additional Tables
- `subjects`, `attendance`, `marks`, `notices`, `enrollments`
- `navigation_places`, `navigation_history`
- `lost_found_items`, `lost_found_claims`

---

## API Endpoints

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | No | Login with identifier + password + role |
| GET | `/api/auth/me` | Yes | Get current user profile |

### Users (Admin)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users` | Admin | List users (filter by ?role=) |
| POST | `/api/users` | Admin | Create user |
| PUT | `/api/users/:id` | Admin | Update user |

### Timetable
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/timetable` | Yes | List timetable (?include_inactive=true) |
| POST | `/api/timetable` | Admin | Add entry |
| PUT | `/api/timetable/:id` | Admin | Soft-update entry |
| DELETE | `/api/timetable/:id` | Admin | Soft-deactivate entry |
| GET | `/api/timetable/history?room=` | Admin | Full history for a room |

### Classroom
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/classroom/status?room=` | Yes | Current status + upcoming today |

### Navigation
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/navigation/search?q=` | Yes | Autocomplete place search |
| GET | `/api/navigation/place/:id` | Yes | Place details + directions |
| GET | `/api/navigation/history` | Yes | User's recent searches |
| POST | `/api/navigation/history` | Yes | Save search record |
| DELETE | `/api/navigation/history` | Yes | Clear user's visible history |
| GET | `/api/navigation/history/all` | Admin | All searches (with filters) |

### Lost & Found
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/lost-found` | No | List items (?type=&category=&status=) |
| POST | `/api/lost-found` | Yes | Post item (multipart) |
| GET | `/api/lost-found/:id` | No | Item details |
| POST | `/api/lost-found/:id/claim` | Yes | Submit claim (multipart) |
| GET | `/api/lost-found/:id/claims` | Owner | View claims on item |
| PATCH | `/api/lost-found/claims/:id/approve` | Owner | Approve claim |
| PATCH | `/api/lost-found/claims/:id/reject` | Owner | Reject claim |
| GET | `/api/lost-found/admin/all` | Admin | All items (with filters) |
| GET | `/api/lost-found/admin/claims` | Admin | All claims |
| DELETE | `/api/lost-found/admin/:id` | Admin | Deactivate item |

### Other
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET/POST | `/api/subjects` | Yes | List / Create subjects |
| GET/POST | `/api/attendance` | Yes | List / Mark attendance |
| GET/POST | `/api/marks` | Yes | List / Enter marks |
| GET/POST | `/api/notices` | Yes | List / Post notices |
| DELETE | `/api/notices/:id` | Admin | Delete notice |
| GET | `/api/reports/*` | Admin | Attendance & marks reports |

---

## Installation & Setup

### Prerequisites
- Node.js 18+
- npm

### Backend Setup

```bash
cd backend
npm install
```

Create `.env` (already present with defaults):

```
PORT=5000
JWT_SECRET=smart_campus_jwt_secret_key_2024
```

Seed the database:

```bash
npm run seed
```

Start the server:

```bash
npm start
# Server runs on http://localhost:5000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
# App runs on http://localhost:5173
```

The Vite dev server proxies `/api` requests to `http://localhost:5000`.

---

## Test Credentials

After running `npm run seed`:

### Admin
| Email | Password |
|-------|----------|
| admin@campus.com | admin123 |
| admn@project.com | password123 |

### Faculty (use Staff ID)
| Staff ID | Name | Password |
|----------|------|----------|
| FAC001 | Prof. Priya Sharma | faculty123 |
| FAC002 | Prof. Rahul Verma | faculty123 |
| FAC003 | Prof. Anita Rao | faculty123 |
| FAC004 | Prof. Suresh Kumar | faculty123 |
| FAC005 | Prof. Deepa Nair | faculty123 |

### Students (use Register Number)
| Register Number | Name | Password |
|-----------------|------|----------|
| 21CSE001 | Student 1 CSE | student123 |
| 21CSE002 | Student 2 CSE | student123 |
| ... | ... | ... |
| 21CSE010 | Student 10 CSE | student123 |
| 21ECE001 | Student 11 ECE | student123 |
| ... | ... | ... |
| 21ECE010 | Student 20 ECE | student123 |

---

## Seeded Data

The seed script populates:

- **22 users**: 2 admins, 5 faculty, 15 students (10 CSE + 10 ECE... actually 10 CSE + 10 ECE = 20 students + 2 admins + 5 faculty = 22 unique seeded users, corrected: 20 students total — 10 CSE + 10 ECE)
- **6 subjects**: Data Structures, Algorithms, Web Development, Digital Electronics, Signal Processing, Embedded Systems
- **40+ timetable entries**: Across J Block, A Block, B Block rooms for all 5 weekdays
- **5 historical timetable entries**: Deactivated/old versions
- **30+ navigation places**: All classrooms (J101–J110, A101–A110, B101–B110), Library, Labs, Offices, Canteen, Auditorium, Hostels, etc.
- **18 lost & found items**: 10 lost items, 8 found items (mix of Active, Claimed, Expired statuses)
- **3 claims**: 1 pending, 1 approved, 1 rejected
- **30 days of attendance** per student per subject
- **12 notices** across all categories
- **Marks** for all students

---

## Login Instructions

1. Open the app at `http://localhost:5173`
2. Select your role tab at the top:
   - **Student** → Enter Register Number (e.g. `21CSE001`)
   - **Staff / Faculty** → Enter Staff ID (e.g. `FAC001`)
   - **Admin** → Enter Email (e.g. `admin@campus.com`)
3. Enter password and click Sign In
4. Use the sidebar to navigate features

---

## Development Notes

- The database file (`campus.db`) is created automatically in `backend/db/` when the server starts.
- To reset all data, delete `backend/db/campus.db` and run `npm run seed` again.
- File uploads for Lost & Found are stored in `backend/uploads/lost-found/` and served via `express.static`.
- The SVG campus map uses a 0–100 coordinate grid. Each place has `map_x` and `map_y` values for positioning.
- Admin-only routes are protected with `requireRole('admin')` middleware.
- All timetables use soft-deletes — no data is ever permanently deleted.
