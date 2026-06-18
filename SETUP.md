# Smart Campus Digital System — Windows Setup Guide

A step-by-step guide to set up and run the **Smart Campus Digital System** (MERN stack) on a Windows laptop.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation Steps](#installation-steps)
  - [1. Install Node.js](#1-install-nodejs)
  - [2. Install MongoDB](#2-install-mongodb)
  - [3. Install Git (optional)](#3-install-git-optional)
- [Project Setup](#project-setup)
  - [4. Get the Code](#4-get-the-code)
  - [5. Backend Setup](#5-backend-setup)
  - [6. Seed the Database](#6-seed-the-database)
  - [7. Start the Backend Server](#7-start-the-backend-server)
  - [8. Frontend Setup](#8-frontend-setup)
  - [9. Open the Application](#9-open-the-application)
- [Login Credentials](#login-credentials)
- [Running the App (Quick Reference)](#running-the-app-quick-reference)
- [Windows-Specific Notes](#windows-specific-notes)
- [Troubleshooting](#troubleshooting)
- [MongoDB Atlas Alternative (No Local Install)](#mongodb-atlas-alternative-no-local-install)
- [Using Docker for MongoDB](#using-docker-for-mongodb)

---

## Prerequisites

| Software | Version | Purpose |
|----------|---------|---------|
| Docker | 24+ | Container runtime (replaces Node.js + MongoDB install) |
| — or — | | |
| Node.js | 18 or later | JavaScript runtime (manual setup only) |
| npm | Comes with Node.js | Package manager (manual setup only) |
| MongoDB | 7.x or later | Database (manual setup only) |

---

## Installation Steps

### 1. Install Node.js

1. Go to https://nodejs.org/
2. Download the **LTS (Long Term Support)** version.
3. Run the installer (`.msi` file).
4. Follow the wizard — keep all defaults.
5. **Verify installation**:
   - Open **Command Prompt** (Press `Win + R`, type `cmd`, press Enter).
   - Run:
     ```cmd
     node --version
     npm --version
     ```
   - You should see version numbers (e.g., `v20.11.0` and `10.2.4`).

### 2. Install MongoDB

Choose **one** of the following options:

#### Option A — Local Install (Recommended for offline use)

1. Go to https://www.mongodb.com/try/download/community
2. Select **Version** `7.0+`, **Platform** `Windows`.
3. Download the `.msi` installer.
4. Run the installer:
   - Choose **Complete** setup type.
   - Check **Install MongoDB as a Service** (default).
   - Leave **MongoDB Compass** unchecked (optional GUI tool, can be installed later).
5. After installation, MongoDB runs automatically as a Windows service.
6. **Verify**:
   ```cmd
   net start MongoDB
   ```
   You should see: *"The MongoDB service is starting... The MongoDB service was started successfully."*

#### Option B — MongoDB Atlas (Cloud, No Local Install)

See the [MongoDB Atlas section](#mongodb-atlas-alternative-no-local-install) below.

### 3. Install Git (optional)

Only needed if you are cloning the repository.

1. Go to https://git-scm.com/download/win
2. Download and run the installer (defaults are fine).
3. **Verify**:
   ```cmd
   git --version
   ```

---

## Project Setup

### 4. Get the Code

Choose one method:

#### Method A — Clone via Git
```cmd
git clone <repository-url> smart-campus
cd smart-campus
```

#### Method B — Copy from USB / network drive
Copy the entire project folder to your Windows laptop. Place it close to the root (e.g., `C:\smart-campus`) to avoid long path issues.

### 5. Backend Setup

```cmd
cd backend
npm install
```

This installs all backend dependencies (Express, Mongoose, JWT, bcryptjs, Multer, etc.).

#### Configure Environment Variables

Open the file `backend\.env` in a text editor (Notepad, VS Code, etc.).

It should look like this:
```
PORT=5000
JWT_SECRET=smart_campus_jwt_secret_key_2024
MONGO_URI=mongodb://localhost:27017/smart_campus
```

- `PORT` — The port the backend server runs on (default: 5000).
- `JWT_SECRET` — Secret key for signing authentication tokens.
- `MONGO_URI` — MongoDB connection string.
  - For **local MongoDB**: keep as `mongodb://localhost:27017/smart_campus`
  - For **MongoDB Atlas**: replace with your Atlas connection string (see [Atlas section](#mongodb-atlas-alternative-no-local-install)).
  - For **Docker MongoDB**: keep as `mongodb://localhost:27017/smart_campus` (if using host networking).

**Save the file.**

### 6. Seed the Database

Run the seed script to populate the database with sample data:

```cmd
npm run seed
```

Expected output:
```
MongoDB connected: <connection-string>
MongoDB seeded successfully
```

This creates:
- 22 users (Admin, Faculty, Students)
- 6 subjects
- 40+ timetable entries
- Navigation places, lost & found items, attendance records, notices, and marks.

> **Note**: If you see `MongoDB connection error`, MongoDB is not running. Start it (see Troubleshooting).

### 7. Start the Backend Server

```cmd
npm start
```

You should see:
```
Server running on port 5000
MongoDB connected: mongodb://localhost:27017/smart_campus
```

**Keep this terminal window open.** The backend is now running at `http://localhost:5000`.

### 8. Frontend Setup

Open a **new** Command Prompt window (do not close the backend terminal).

```cmd
cd frontend
npm install
npm run dev
```

You should see:
```
VITE v8.x.x  ready in <time>
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

The frontend development server is now running at `http://localhost:5173`.

### 9. Open the Application

1. Open your web browser (Chrome, Edge, Firefox).
2. Navigate to `http://localhost:5173`.
3. You should see the **Login** page.

---

## Docker Setup (Easiest — No Manual Installs)

If you have **Docker** installed, you can skip installing Node.js and MongoDB entirely.

### Quick Start

```cmd
:: 1. Start all services (MongoDB + Backend + Frontend)
docker compose up --build

:: 2. Open a second terminal and seed the database (first time only)
docker compose exec backend npm run seed
```

Open `http://localhost:5173` in your browser.

### How It Works

The `docker-compose.yml` at the project root defines three services:

| Service | Image / Build | Port | Purpose |
|---------|---------------|------|---------|
| `mongo` | `mongo:7` | `27017` | Database |
| `backend` | `./backend/Dockerfile` | `5000` | Express API |
| `frontend` | `./frontend/Dockerfile` | `5173` | Vite dev server |

- The backend connects to MongoDB via the internal Docker hostname `mongo`.
- The frontend proxies `/api` requests to the `backend` service.
- Source code is mounted as volumes — changes are reflected immediately (hot-reload on both frontend and backend with `nodemon`).

### Useful Commands

```cmd
:: Rebuild and start
docker compose up --build

:: Start in background (detached)
docker compose up --build -d

:: View logs
docker compose logs -f

:: Stop all services
docker compose down

:: Run seed (re-populate database)
docker compose exec backend npm run seed

:: Open a shell inside a container
docker compose exec backend sh
docker compose exec frontend sh
```

### Transporting to Another Laptop

1. Copy the entire project folder to the new laptop.
2. Install Docker on the new laptop.
3. Run `docker compose up --build`.
4. Run `docker compose exec backend npm run seed` (first time only).

No Node.js, npm, or MongoDB installation needed on the new machine.

---

## Login Credentials

After seeding, use these credentials:

| Role | Identifier | Password |
|------|-----------|----------|
| **Admin** | `admin@campus.com` | `admin123` |
| Admin (alt) | `admn@project.com` | `password123` |
| **Faculty** | `FAC001` | `faculty123` |
| Faculty | `FAC002` | `faculty123` |
| Faculty | `FAC003` | `faculty123` |
| Faculty | `FAC004` | `faculty123` |
| Faculty | `FAC005` | `faculty123` |
| **Student** | `21CSE001` | `student123` |
| Student | `21CSE002` ... `21CSE010` | `student123` |
| Student | `21ECE001` ... `21ECE010` | `student123` |

> The login page has role tabs. Select the correct role before entering credentials.

---

## Running the App (Quick Reference)

### With Docker (Recommended)

```cmd
:: Start everything
docker compose up

:: Seed database (first time only)
docker compose exec backend npm run seed
```

Open `http://localhost:5173` in your browser.

### Without Docker (Manual)

1. **Start MongoDB** (if not running automatically):
   ```cmd
   net start MongoDB
   ```

2. **Start Backend** (Terminal 1):
   ```cmd
   cd path\to\smart-campus\backend
   npm start
   ```

3. **Start Frontend** (Terminal 2):
   ```cmd
   cd path\to\smart-campus\frontend
   npm run dev
   ```

4. Open `http://localhost:5173` in your browser.

---

## Windows-Specific Notes

### Path Length Issues
- If `npm install` fails with errors about long paths, enable long path support:
  ```cmd
  git config --system core.longpaths true
  ```
- Or move the project to a shorter path (e.g., `C:\smart-campus`).

### File Path Separators
- The code uses forward slashes (`/`) in paths — this works fine on Windows with Node.js.

### Firewall Prompts
- Windows Firewall may ask for permission when Node.js tries to accept connections.
- Click **Allow** for both Private and Public networks.

### Command Prompt vs PowerShell
- All commands in this guide work in **Command Prompt (cmd)**.
- If using **PowerShell** or **Windows Terminal**, the commands are the same.

### Port Conflicts
- If port **5000** is already in use, change it in `backend\.env`:
  ```
  PORT=5001
  ```
- If port **5173** is already in use, Vite will automatically suggest the next available port.

---

## Troubleshooting

### "MongoDB connection error" or "ECONNREFUSED"

**Cause**: MongoDB is not running.

**Fix**:
```cmd
net start MongoDB
```
If the service is not installed, use **MongoDB Atlas** (see below).

### "npm install" fails

**Fix**:
```cmd
del node_modules /s /q
del package-lock.json
npm install
```
Or use:
```cmd
npm install --no-optional
```

### "MODULE_NOT_FOUND" errors

**Cause**: `npm install` was not run in the correct directory.

**Fix**:
```cmd
cd backend
npm install
```

### Port already in use (5000)

**Fix 1**: Kill the process using the port:
```cmd
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**Fix 2**: Change the port in `backend\.env`:
```
PORT=5001
```
Then update `frontend\vite.config.js` proxy target to match.

### "SyntaxError" or unexpected token

**Cause**: Using an older version of Node.js.

**Fix**: Install Node.js 18 or later.

### CORS errors in browser

**Cause**: Backend is not running or wrong URL.

**Fix**:
- Ensure backend terminal shows "Server running on port 5000".
- Check that the frontend Vite config proxies `/api` to `http://localhost:5000`.

---

## MongoDB Atlas Alternative (No Local Install)

If you do not want to install MongoDB locally:

1. Go to https://cloud.mongodb.com/ and sign up / log in.
2. Create a **free M0 cluster** (choose any cloud provider/region).
3. Under **Database Access**, create a database user (username + password).
4. Under **Network Access**, add `0.0.0.0/0` (allows access from any IP).
5. Click **Connect** → **Drivers** → copy the connection string.
6. It looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
7. Replace `<username>` and `<password>` with your database user credentials.
8. Paste this string into `backend\.env` as the `MONGO_URI` value:
   ```
   MONGO_URI=mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/smart_campus?retryWrites=true&w=majority
   ```
   > **Important**: Change `?retryWrites=true&w=majority` to `/smart_campus?retryWrites=true&w=majority`
   > (insert the database name `smart_campus` after the hostname).

9. Proceed with [Step 6 — Seed the Database](#6-seed-the-database).

---

## Stopping the Application

### With Docker
```cmd
docker compose down
```

### Without Docker
- **Backend**: Press `Ctrl + C` in the backend terminal, then type `Y` if prompted.
- **Frontend**: Press `Ctrl + C` in the frontend terminal, then type `Y` if prompted.
- **MongoDB** (if running as service): It runs in the background — no action needed.

---

## Project Architecture Summary

```
smart-campus/
├── backend/
│   ├── .env                  # Environment variables
│   ├── index.js              # Express server (port 5000)
│   ├── models/               # Mongoose schemas (User, Subject, etc.)
│   ├── controllers/          # Business logic
│   ├── routes/               # API route definitions
│   ├── middleware/           # Auth middleware
│   ├── db/                   # Database config, seed, migration
│   └── uploads/              # File uploads (lost & found photos)
│
├── frontend/
│   ├── src/                  # React application
│   │   ├── pages/            # Login, Dashboard, Timetable, etc.
│   │   ├── components/       # Layout, ProtectedRoute, etc.
│   │   ├── context/          # AuthContext
│   │   └── utils/            # Axios client config
│   ├── vite.config.js        # Vite config with API proxy
│   └── package.json          # Frontend dependencies
│
└── README.md                 # Project documentation
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, Tailwind CSS 3, React Router 7 |
| Backend | Node.js, Express 4 |
| Database | MongoDB (Mongoose ODM) |
| Authentication | JWT (jsonwebtoken + bcryptjs) |
| File Upload | Multer |
| Charts | Recharts |
| Icons | Lucide React |
| HTTP Client | Axios |
| Notifications | react-hot-toast |

---

## Useful Scripts

### Backend (`backend/package.json`)
| Command | Description |
|---------|-------------|
| `npm start` | Start the backend server |
| `npm run seed` | Seed database with sample data |
| `npm run migrate` | Migrate from legacy SQLite to MongoDB |

### Frontend (`frontend/package.json`)
| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm run lint` | Lint source code |
| `npm run preview` | Preview production build |

---

> **Need help?** If you encounter any issues not listed here, check the project's `README.md` or contact the development team.
