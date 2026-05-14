const bcrypt = require('bcryptjs');
const { getDB } = require('./database');

const db = getDB();

function seed() {
  console.log('Clearing existing data...');
  db.exec(`
    DELETE FROM attendance;
    DELETE FROM marks;
    DELETE FROM timetable;
    DELETE FROM enrollments;
    DELETE FROM notices;
    DELETE FROM subjects;
    DELETE FROM users;
  `);

  const hash = (pw) => bcrypt.hashSync(pw, 10);

  console.log('Seeding users...');

  const insertUser = db.prepare(
    'INSERT INTO users (name, email, password, role, department, phone, active) VALUES (?, ?, ?, ?, ?, ?, 1)'
  );

  const users = [
    // Admins
    { name: 'Dr. Arjun Mehta', email: 'admin@campus.com', password: hash('admin123'), role: 'admin', department: 'Administration', phone: '9876543210' },
    { name: 'System Admin', email: 'admn@project.com', password: hash('password123'), role: 'admin', department: 'Administration', phone: '9876543211' },
    // Faculty - CSE
    { name: 'Prof. Priya Sharma', email: 'faculty1@campus.com', password: hash('faculty123'), role: 'faculty', department: 'CSE', phone: '9876543212' },
    { name: 'Prof. Rahul Verma', email: 'faculty2@campus.com', password: hash('faculty123'), role: 'faculty', department: 'CSE', phone: '9876543213' },
    { name: 'Prof. Anita Rao', email: 'faculty3@campus.com', password: hash('faculty123'), role: 'faculty', department: 'CSE', phone: '9876543214' },
    // Faculty - ECE
    { name: 'Prof. Suresh Kumar', email: 'faculty4@campus.com', password: hash('faculty123'), role: 'faculty', department: 'ECE', phone: '9876543215' },
    { name: 'Prof. Deepa Nair', email: 'faculty5@campus.com', password: hash('faculty123'), role: 'faculty', department: 'ECE', phone: '9876543216' },
  ];

  // Students - CSE (1-10)
  for (let i = 1; i <= 10; i++) {
    users.push({
      name: `Student ${i} CSE`,
      email: `student${i}@campus.com`,
      password: hash('student123'),
      role: 'student',
      department: 'CSE',
      phone: `98765432${40 + i}`,
    });
  }
  // Students - ECE (11-20)
  for (let i = 11; i <= 20; i++) {
    users.push({
      name: `Student ${i} ECE`,
      email: `student${i}@campus.com`,
      password: hash('student123'),
      role: 'student',
      department: 'ECE',
      phone: `98765433${i - 10}`,
    });
  }

  const userIds = users.map((u) => {
    const info = insertUser.run(u.name, u.email, u.password, u.role, u.department, u.phone);
    return info.lastInsertRowid;
  });

  const adminIds = userIds.slice(0, 2);
  const facultyIds = userIds.slice(2, 7);
  const studentIds = userIds.slice(7);
  const cseStudentIds = studentIds.slice(0, 10);
  const eceStudentIds = studentIds.slice(10, 20);

  console.log('Seeding subjects...');
  const insertSubject = db.prepare(
    'INSERT INTO subjects (name, code, department, semester, credits, faculty_id) VALUES (?, ?, ?, ?, ?, ?)'
  );

  const subjects = [
    { name: 'Data Structures', code: 'CSE201', department: 'CSE', semester: 3, credits: 4, faculty_id: facultyIds[0] },
    { name: 'Algorithms', code: 'CSE202', department: 'CSE', semester: 3, credits: 4, faculty_id: facultyIds[1] },
    { name: 'Web Development', code: 'CSE301', department: 'CSE', semester: 5, credits: 3, faculty_id: facultyIds[2] },
    { name: 'Digital Electronics', code: 'ECE201', department: 'ECE', semester: 3, credits: 4, faculty_id: facultyIds[3] },
    { name: 'Signal Processing', code: 'ECE301', department: 'ECE', semester: 5, credits: 3, faculty_id: facultyIds[4] },
    { name: 'Embedded Systems', code: 'ECE401', department: 'ECE', semester: 7, credits: 4, faculty_id: facultyIds[3] },
  ];

  const subjectIds = subjects.map((s) => {
    const info = insertSubject.run(s.name, s.code, s.department, s.semester, s.credits, s.faculty_id);
    return info.lastInsertRowid;
  });

  console.log('Seeding enrollments...');
  const insertEnrollment = db.prepare(
    'INSERT INTO enrollments (student_id, subject_id) VALUES (?, ?)'
  );

  // CSE subjects: 0, 1, 2; ECE subjects: 3, 4, 5
  const cseSubjectIds = [subjectIds[0], subjectIds[1], subjectIds[2]];
  const eceSubjectIds = [subjectIds[3], subjectIds[4], subjectIds[5]];

  for (const sid of cseStudentIds) {
    for (const subId of cseSubjectIds) {
      insertEnrollment.run(sid, subId);
    }
  }
  for (const sid of eceStudentIds) {
    for (const subId of eceSubjectIds) {
      insertEnrollment.run(sid, subId);
    }
  }

  console.log('Seeding timetable...');
  const insertTimetable = db.prepare(
    'INSERT INTO timetable (subject_id, day, start_time, end_time, room, semester) VALUES (?, ?, ?, ?, ?, ?)'
  );

  const timetableData = [
    // CSE subjects - semester 3
    { subject_id: subjectIds[0], day: 'Monday', start_time: '09:00', end_time: '10:30', room: 'LH-101', semester: 3 },
    { subject_id: subjectIds[1], day: 'Monday', start_time: '11:00', end_time: '12:30', room: 'LH-102', semester: 3 },
    { subject_id: subjectIds[0], day: 'Tuesday', start_time: '09:00', end_time: '10:30', room: 'LH-101', semester: 3 },
    { subject_id: subjectIds[1], day: 'Wednesday', start_time: '09:00', end_time: '10:30', room: 'LH-102', semester: 3 },
    { subject_id: subjectIds[2], day: 'Tuesday', start_time: '14:00', end_time: '15:30', room: 'CL-201', semester: 5 },
    { subject_id: subjectIds[2], day: 'Thursday', start_time: '09:00', end_time: '10:30', room: 'CL-201', semester: 5 },
    // ECE subjects
    { subject_id: subjectIds[3], day: 'Monday', start_time: '14:00', end_time: '15:30', room: 'LH-301', semester: 3 },
    { subject_id: subjectIds[3], day: 'Wednesday', start_time: '11:00', end_time: '12:30', room: 'LH-301', semester: 3 },
    { subject_id: subjectIds[4], day: 'Tuesday', start_time: '11:00', end_time: '12:30', room: 'LH-302', semester: 5 },
    { subject_id: subjectIds[4], day: 'Thursday', start_time: '14:00', end_time: '15:30', room: 'LH-302', semester: 5 },
    { subject_id: subjectIds[5], day: 'Friday', start_time: '09:00', end_time: '10:30', room: 'EL-401', semester: 7 },
    { subject_id: subjectIds[5], day: 'Friday', start_time: '11:00', end_time: '12:30', room: 'EL-401', semester: 7 },
  ];

  for (const t of timetableData) {
    insertTimetable.run(t.subject_id, t.day, t.start_time, t.end_time, t.room, t.semester);
  }

  console.log('Seeding attendance records (30 days per student per subject)...');
  const insertAttendance = db.prepare(
    'INSERT OR IGNORE INTO attendance (student_id, subject_id, date, status) VALUES (?, ?, ?, ?)'
  );

  const statuses = ['Present', 'Present', 'Present', 'Present', 'Present', 'Present', 'Absent', 'Late'];
  const startDate = new Date('2025-01-15');

  for (let d = 0; d < 30; d++) {
    const dateObj = new Date(startDate);
    dateObj.setDate(dateObj.getDate() + d);
    if (dateObj.getDay() === 0 || dateObj.getDay() === 6) continue;
    const dateStr = dateObj.toISOString().split('T')[0];

    for (const sid of studentIds) {
      const deptSubjects = sid <= cseStudentIds[cseStudentIds.length - 1] ? cseSubjectIds : eceSubjectIds;
      for (const subId of deptSubjects) {
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        insertAttendance.run(sid, subId, dateStr, status);
      }
    }
  }

  console.log('Seeding marks...');
  const insertMark = db.prepare(
    'INSERT OR IGNORE INTO marks (student_id, subject_id, exam_type, score, max_score) VALUES (?, ?, ?, ?, ?)'
  );

  for (const sid of studentIds) {
    const deptSubjects = sid <= cseStudentIds[cseStudentIds.length - 1] ? cseSubjectIds : eceSubjectIds;
    for (const subId of deptSubjects) {
      insertMark.run(sid, subId, 'Mid', Math.floor(Math.random() * 30) + 20, 50);
      insertMark.run(sid, subId, 'Final', Math.floor(Math.random() * 50) + 30, 100);
      insertMark.run(sid, subId, 'Assignment', Math.floor(Math.random() * 15) + 10, 25);
    }
  }

  console.log('Seeding notices...');
  const insertNotice = db.prepare(
    'INSERT INTO notices (title, body, category, posted_by, target_role, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  );

  const notices = [
    { title: 'Mid-Semester Exam Schedule', body: 'Mid-semester examinations will begin from March 15. Please check the exam portal for your personalized timetable.', category: 'Exam', posted_by: adminIds[0], target_role: 'all', created_at: '2025-02-01 09:00:00' },
    { title: 'Annual Tech Fest - Synapse 2025', body: 'Get ready for the annual technical festival Synapse 2025! Registrations are open until Feb 28. Participate in coding competitions, robotics, and more.', category: 'Event', posted_by: adminIds[0], target_role: 'all', created_at: '2025-02-05 10:30:00' },
    { title: 'Holiday on March 8', body: 'The campus will remain closed on March 8 on account of Holi. All classes scheduled for that day will be rescheduled.', category: 'Holiday', posted_by: adminIds[0], target_role: 'all', created_at: '2025-02-10 08:00:00' },
    { title: 'Library Timings Extended', body: 'The central library will remain open until 10 PM during the exam season starting March 1. Weekend timings remain unchanged.', category: 'General', posted_by: facultyIds[0], target_role: 'all', created_at: '2025-02-12 14:00:00' },
    { title: 'Project Submission Deadline', body: 'All final year project reports must be submitted by April 10. Late submissions will incur a penalty of 5 marks per day.', category: 'Exam', posted_by: adminIds[1], target_role: 'student', created_at: '2025-02-15 11:00:00' },
    { title: 'Faculty Development Workshop', body: 'A two-day workshop on AI in Education will be held on March 5-6. All faculty members are expected to attend.', category: 'Event', posted_by: adminIds[0], target_role: 'faculty', created_at: '2025-02-18 09:30:00' },
    { title: 'Summer Vacation Notice', body: 'Summer break will commence from May 1. The campus will reopen on June 15 for the new academic session.', category: 'Holiday', posted_by: adminIds[0], target_role: 'all', created_at: '2025-02-20 10:00:00' },
    { title: 'Hostel Accommodation Registration', body: 'Hostel registration for the next semester is now open. Apply through the student portal before March 20.', category: 'General', posted_by: adminIds[1], target_role: 'student', created_at: '2025-02-22 13:00:00' },
    { title: 'Sports Day Announcement', body: 'The annual Sports Day will be held on March 25. Interested students should register with their respective department coordinators.', category: 'Event', posted_by: facultyIds[1], target_role: 'all', created_at: '2025-02-25 08:00:00' },
    { title: 'Campus Maintenance Notice', body: 'The main building will undergo electrical maintenance on March 2 (Sunday). Access will be restricted between 8 AM and 5 PM.', category: 'General', posted_by: adminIds[0], target_role: 'all', created_at: '2025-02-26 15:00:00' },
    { title: 'Assignment Submission for DS', body: 'All students are reminded to submit their Data Structures assignment by March 5. Late submissions will not be accepted.', category: 'Exam', posted_by: facultyIds[0], target_role: 'student', created_at: '2025-02-27 10:00:00' },
    { title: 'Blood Donation Camp', body: 'A blood donation camp is being organized by the NSS unit on March 10. Donate blood and save lives!', category: 'Event', posted_by: facultyIds[2], target_role: 'all', created_at: '2025-02-28 09:00:00' },
  ];

  for (const n of notices) {
    insertNotice.run(n.title, n.body, n.category, n.posted_by, n.target_role, n.created_at);
  }

  console.log('');
  console.log('=== SEED COMPLETE ===');
  console.log('');
  console.log('Test Credentials:');
  console.log('  Admin:    admin@campus.com / admin123');
  console.log('  Admin:    admn@project.com / password123');
  console.log('  Faculty:  faculty1@campus.com / faculty123');
  console.log('  Student:  student1@campus.com / student123');
  console.log('');
}

seed();
