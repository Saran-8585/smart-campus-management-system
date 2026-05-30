const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'campus.db');

let db;

function getDB() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initTables();
  }
  return db;
}

function initTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin','faculty','student')),
      department TEXT,
      phone TEXT,
      register_number TEXT UNIQUE,
      staff_id TEXT UNIQUE,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      department TEXT NOT NULL,
      semester INTEGER NOT NULL,
      credits INTEGER NOT NULL DEFAULT 3,
      faculty_id INTEGER REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS timetable (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject_id INTEGER NOT NULL REFERENCES subjects(id),
      day TEXT NOT NULL CHECK(day IN ('Monday','Tuesday','Wednesday','Thursday','Friday')),
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      room TEXT NOT NULL,
      semester INTEGER NOT NULL,
      faculty_name TEXT,
      department TEXT,
      section TEXT,
      is_active INTEGER DEFAULT 1,
      deactivated_at TEXT,
      updated_by INTEGER REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES users(id),
      subject_id INTEGER NOT NULL REFERENCES subjects(id),
      date TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('Present','Absent','Late')),
      UNIQUE(student_id, subject_id, date)
    );

    CREATE TABLE IF NOT EXISTS marks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES users(id),
      subject_id INTEGER NOT NULL REFERENCES subjects(id),
      exam_type TEXT NOT NULL CHECK(exam_type IN ('Mid','Final','Assignment')),
      score REAL NOT NULL,
      max_score REAL NOT NULL DEFAULT 100,
      UNIQUE(student_id, subject_id, exam_type)
    );

    CREATE TABLE IF NOT EXISTS notices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('Exam','Event','Holiday','General')),
      posted_by INTEGER NOT NULL REFERENCES users(id),
      target_role TEXT DEFAULT 'all' CHECK(target_role IN ('all','student','faculty','admin')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES users(id),
      subject_id INTEGER NOT NULL REFERENCES subjects(id),
      UNIQUE(student_id, subject_id)
    );

    CREATE TABLE IF NOT EXISTS navigation_places (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      block TEXT,
      floor TEXT,
      description TEXT,
      landmark_hint TEXT,
      directions_from_gate TEXT,
      map_x REAL DEFAULT 0,
      map_y REAL DEFAULT 0,
      category TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS navigation_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      search_query TEXT NOT NULL,
      place_id INTEGER,
      place_name TEXT,
      searched_at TEXT DEFAULT (datetime('now')),
      is_hidden INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS lost_found_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      posted_by INTEGER NOT NULL REFERENCES users(id),
      type TEXT NOT NULL CHECK(type IN ('Lost','Found')),
      item_name TEXT NOT NULL,
      description TEXT,
      category TEXT DEFAULT 'Other',
      date_occurred TEXT,
      location TEXT,
      image_path TEXT,
      contact_info TEXT,
      where_item_now TEXT,
      status TEXT DEFAULT 'Active' CHECK(status IN ('Active','Claimed','Expired')),
      created_at TEXT DEFAULT (datetime('now')),
      expires_at TEXT
    );

    CREATE TABLE IF NOT EXISTS lost_found_claims (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL REFERENCES lost_found_items(id),
      claimant_id INTEGER NOT NULL REFERENCES users(id),
      claim_description TEXT,
      proof_image_path TEXT,
      status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending','Approved','Rejected')),
      submitted_at TEXT DEFAULT (datetime('now')),
      resolved_at TEXT
    );
  `);
}

/*
 * DATABASE NOTE:
 * No table in this system uses hard DELETE.
 * All records are soft-deleted or status-updated to preserve full history.
 * - Timetable: is_active flag, deactivated_at timestamp
 * - Navigation history: is_hidden flag
 * - Lost & found items: status field (Active/Claimed/Expired)
 * - Lost & found claims: status field (Pending/Approved/Rejected)
 * - Users: active flag
 */

module.exports = { getDB };
