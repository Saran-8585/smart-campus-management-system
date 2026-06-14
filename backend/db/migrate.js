require('dotenv').config();
const Database = require('better-sqlite3');
const path = require('path');
const { connectDB, mongoose } = require('./mongoose');
const User = require('../models/User');
const Subject = require('../models/Subject');
const Timetable = require('../models/Timetable');
const Attendance = require('../models/Attendance');
const Notice = require('../models/Notice');
const Enrollment = require('../models/Enrollment');
const NavigationPlace = require('../models/NavigationPlace');
const NavigationHistory = require('../models/NavigationHistory');
const LostFoundItem = require('../models/LostFoundItem');
const LostFoundClaim = require('../models/LostFoundClaim');

async function migrate() {
  const dbPath = path.join(__dirname, 'campus.db');
  let sqlite;
  try {
    sqlite = new Database(dbPath);
  } catch {
    console.error('campus.db not found at', dbPath);
    console.log('Nothing to migrate. Run npm run seed instead.');
    process.exit(0);
  }

  await connectDB();
  console.log('Starting SQLite → MongoDB migration...\n');

  const idMap = { users: {}, subjects: {}, places: {}, items: {} };

  // 1. Users
  console.log('Migrating users...');
  const users = sqlite.prepare('SELECT * FROM users').all();
  for (const u of users) {
    const doc = await User.create({
      name: u.name, email: u.email, password: u.password,
      role: u.role, department: u.department, phone: u.phone,
      register_number: u.register_number, staff_id: u.staff_id,
      active: u.active, created_at: u.created_at || new Date(),
    });
    idMap.users[u.id] = doc._id;
  }
  console.log(`  ${users.length} users migrated`);

  // 2. Subjects
  console.log('Migrating subjects...');
  const subjects = sqlite.prepare('SELECT * FROM subjects').all();
  for (const s of subjects) {
    const doc = await Subject.create({
      name: s.name, code: s.code, department: s.department,
      semester: s.semester, credits: s.credits,
      faculty_id: s.faculty_id ? idMap.users[s.faculty_id] : null,
      active: s.active,
    });
    idMap.subjects[s.id] = doc._id;
  }
  console.log(`  ${subjects.length} subjects migrated`);

  // 3. Enrollments
  console.log('Migrating enrollments...');
  const enrollments = sqlite.prepare('SELECT * FROM enrollments').all();
  const enrDocs = enrollments.map(e => ({
    student_id: idMap.users[e.student_id],
    subject_id: idMap.subjects[e.subject_id],
  }));
  if (enrDocs.length) await Enrollment.insertMany(enrDocs);
  console.log(`  ${enrDocs.length} enrollments migrated`);

  // 4. Timetable
  console.log('Migrating timetable...');
  const timetable = sqlite.prepare('SELECT * FROM timetable').all();
  const ttDocs = timetable.map(t => ({
    subject_id: idMap.subjects[t.subject_id],
    day: t.day, start_time: t.start_time, end_time: t.end_time,
    room: t.room, semester: t.semester, faculty_name: t.faculty_name,
    department: t.department, section: t.section,
    is_active: t.is_active, deactivated_at: t.deactivated_at || undefined,
    updated_by: t.updated_by ? idMap.users[t.updated_by] : undefined,
  }));
  if (ttDocs.length) await Timetable.insertMany(ttDocs);
  console.log(`  ${ttDocs.length} timetable entries migrated`);

  // 5. Notices
  console.log('Migrating notices...');
  const notices = sqlite.prepare('SELECT * FROM notices').all();
  const noticeDocs = notices.map(n => ({
    title: n.title, body: n.body, category: n.category,
    posted_by: idMap.users[n.posted_by],
    target_role: n.target_role, active: n.active,
    created_at: n.created_at || new Date(),
  }));
  if (noticeDocs.length) await Notice.insertMany(noticeDocs);
  console.log(`  ${noticeDocs.length} notices migrated`);

  // 6. Navigation places
  console.log('Migrating navigation places...');
  const places = sqlite.prepare('SELECT * FROM navigation_places').all();
  for (const p of places) {
    const doc = await NavigationPlace.create({
      name: p.name, block: p.block, floor: p.floor,
      description: p.description, landmark_hint: p.landmark_hint,
      directions_from_gate: p.directions_from_gate,
      map_x: p.map_x, map_y: p.map_y, category: p.category,
      created_at: p.created_at || new Date(),
    });
    idMap.places[p.id] = doc._id;
  }
  console.log(`  ${places.length} places migrated`);

  // 7. Navigation history
  console.log('Migrating navigation history...');
  const navHistory = sqlite.prepare('SELECT * FROM navigation_history').all();
  const nhDocs = navHistory.map(h => ({
    user_id: idMap.users[h.user_id],
    search_query: h.search_query,
    place_id: h.place_id ? idMap.places[h.place_id] : null,
    place_name: h.place_name,
    searched_at: h.searched_at || new Date(),
    is_hidden: h.is_hidden,
  }));
  if (nhDocs.length) await NavigationHistory.insertMany(nhDocs);
  console.log(`  ${nhDocs.length} history entries migrated`);

  // 8. Lost & found items
  console.log('Migrating lost & found items...');
  const items = sqlite.prepare('SELECT * FROM lost_found_items').all();
  for (const i of items) {
    const doc = await LostFoundItem.create({
      posted_by: idMap.users[i.posted_by],
      type: i.type, item_name: i.item_name,
      description: i.description, category: i.category,
      date_occurred: i.date_occurred || undefined,
      location: i.location, image_path: i.image_path,
      contact_info: i.contact_info, where_item_now: i.where_item_now,
      status: i.status,
      created_at: i.created_at || new Date(),
      expires_at: i.expires_at || undefined,
    });
    idMap.items[i.id] = doc._id;
  }
  console.log(`  ${items.length} items migrated`);

  // 9. Lost & found claims
  console.log('Migrating lost & found claims...');
  const claims = sqlite.prepare('SELECT * FROM lost_found_claims').all();
  const claimDocs = claims.map(c => ({
    item_id: idMap.items[c.item_id],
    claimant_id: idMap.users[c.claimant_id],
    claim_description: c.claim_description,
    proof_image_path: c.proof_image_path,
    status: c.status,
    submitted_at: c.submitted_at || new Date(),
    resolved_at: c.resolved_at || undefined,
  }));
  if (claimDocs.length) await LostFoundClaim.insertMany(claimDocs);
  console.log(`  ${claimDocs.length} claims migrated`);

  // 10. Attendance
  console.log('Migrating attendance...');
  const attendance = sqlite.prepare('SELECT * FROM attendance').all();
  const attDocs = attendance.map(a => ({
    student_id: idMap.users[a.student_id],
    subject_id: idMap.subjects[a.subject_id],
    date: a.date, status: a.status,
  }));
  if (attDocs.length) {
    try {
      await Attendance.insertMany(attDocs, { ordered: false });
    } catch {
      // Duplicates are OK
    }
  }
  console.log(`  ${attDocs.length} attendance records migrated`);

  sqlite.close();
  console.log('\n=== MIGRATION COMPLETE ===');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
