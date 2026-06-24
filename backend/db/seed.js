require('dotenv').config();
const bcrypt = require('bcryptjs');
const { connectDB } = require('./mongoose');
const User = require('../models/User');
const Subject = require('../models/Subject');
const Timetable = require('../models/Timetable');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const Notice = require('../models/Notice');
const Enrollment = require('../models/Enrollment');
const NavigationPlace = require('../models/NavigationPlace');
const NavigationHistory = require('../models/NavigationHistory');
const LostFoundItem = require('../models/LostFoundItem');
const LostFoundClaim = require('../models/LostFoundClaim');

async function seed() {
  await connectDB();

  console.log('Clearing existing data...');
  await Promise.all([
    LostFoundClaim.deleteMany({}),
    LostFoundItem.deleteMany({}),
    NavigationHistory.deleteMany({}),
    NavigationPlace.deleteMany({}),
    Marks.deleteMany({}),
    Attendance.deleteMany({}),
    Timetable.deleteMany({}),
    Enrollment.deleteMany({}),
    Notice.deleteMany({}),
    Subject.deleteMany({}),
    User.deleteMany({}),

  ]);

  const hash = (pw) => bcrypt.hashSync(pw, 10);

  console.log('Rebuilding indexes...');
  await User.collection.dropIndex('register_number_1').catch(() => {});
  await User.collection.dropIndex('staff_id_1').catch(() => {});
  await User.syncIndexes();

  console.log('Seeding users...');

  const userData = [
    { name: 'Dr. Arjun Mehta', email: 'admin@campus.com', password: hash('admin123'), role: 'admin', department: 'Administration', phone: '9876543210', staff_id: 'ADM001' },
    { name: 'System Admin', email: 'admn@project.com', password: hash('password123'), role: 'admin', department: 'Administration', phone: '9876543211', staff_id: 'ADM002' },
    { name: 'Prof. Priya Sharma', email: 'faculty1@campus.com', password: hash('faculty123'), role: 'faculty', department: 'CSE', phone: '9876543212', staff_id: 'FAC001' },
    { name: 'Prof. Rahul Verma', email: 'faculty2@campus.com', password: hash('faculty123'), role: 'faculty', department: 'CSE', phone: '9876543213', staff_id: 'FAC002' },
    { name: 'Prof. Anita Rao', email: 'faculty3@campus.com', password: hash('faculty123'), role: 'faculty', department: 'CSE', phone: '9876543214', staff_id: 'FAC003' },
    { name: 'Prof. Suresh Kumar', email: 'faculty4@campus.com', password: hash('faculty123'), role: 'faculty', department: 'ECE', phone: '9876543215', staff_id: 'FAC004' },
    { name: 'Prof. Deepa Nair', email: 'faculty5@campus.com', password: hash('faculty123'), role: 'faculty', department: 'ECE', phone: '9876543216', staff_id: 'FAC005' },
  ];

  const cseBatches = [22, 22, 22, 23, 23, 23, 24, 24, 25, 25];
  const eceBatches = [22, 22, 22, 23, 23, 23, 24, 24, 25, 25];
  for (let i = 0; i < 10; i++) {
    const seq = String(i + 1).padStart(3, '0');
    userData.push({ name: `Student ${i + 1} CSE`, email: `student${i + 1}@campus.com`, password: hash('student123'), role: 'student', department: 'CSE', phone: `98765432${41 + i}`, register_number: `${cseBatches[i]}CSE${seq}` });
  }
  for (let i = 0; i < 10; i++) {
    const seq = String(i + 1).padStart(3, '0');
    userData.push({ name: `Student ${i + 11} ECE`, email: `student${i + 11}@campus.com`, password: hash('student123'), role: 'student', department: 'ECE', phone: `98765433${i + 1}`, register_number: `${eceBatches[i]}ECE${seq}` });
  }

  const users = await User.insertMany(userData);

  const adminIds = [users[0]._id, users[1]._id];
  const facultyIds = [users[2]._id, users[3]._id, users[4]._id, users[5]._id, users[6]._id];
  const studentIds = users.slice(7).map(u => u._id);
  const cseStudentIds = studentIds.slice(0, 10);
  const eceStudentIds = studentIds.slice(10, 20);

  console.log('Seeding subjects...');
  const subjectData = [
    { name: 'Data Structures', code: 'CSE201', department: 'CSE', semester: 3, credits: 4, faculty_id: facultyIds[0] },
    { name: 'Algorithms', code: 'CSE202', department: 'CSE', semester: 3, credits: 4, faculty_id: facultyIds[1] },
    { name: 'Web Development', code: 'CSE301', department: 'CSE', semester: 5, credits: 3, faculty_id: facultyIds[2] },
    { name: 'Digital Electronics', code: 'ECE201', department: 'ECE', semester: 3, credits: 4, faculty_id: facultyIds[3] },
    { name: 'Signal Processing', code: 'ECE301', department: 'ECE', semester: 5, credits: 3, faculty_id: facultyIds[4] },
    { name: 'Embedded Systems', code: 'ECE401', department: 'ECE', semester: 7, credits: 4, faculty_id: facultyIds[3] },
    { name: 'Programming Fundamentals', code: 'CSE101', department: 'CSE', semester: 1, credits: 4, faculty_id: facultyIds[0] },
    { name: 'Object Oriented Programming', code: 'CSE102', department: 'CSE', semester: 2, credits: 4, faculty_id: facultyIds[1] },
    { name: 'Database Management Systems', code: 'CSE203', department: 'CSE', semester: 4, credits: 3, faculty_id: facultyIds[2] },
    { name: 'Computer Networks', code: 'CSE302', department: 'CSE', semester: 6, credits: 3, faculty_id: facultyIds[0] },
    { name: 'Project Work', code: 'CSE401', department: 'CSE', semester: 8, credits: 4, faculty_id: facultyIds[1] },
    { name: 'Basic Electronics', code: 'ECE101', department: 'ECE', semester: 1, credits: 4, faculty_id: facultyIds[3] },
    { name: 'Circuit Analysis', code: 'ECE102', department: 'ECE', semester: 2, credits: 4, faculty_id: facultyIds[4] },
    { name: 'Microprocessors', code: 'ECE202', department: 'ECE', semester: 4, credits: 3, faculty_id: facultyIds[3] },
    { name: 'VLSI Design', code: 'ECE302', department: 'ECE', semester: 6, credits: 3, faculty_id: facultyIds[4] },
    { name: 'Project Work', code: 'ECE402', department: 'ECE', semester: 8, credits: 4, faculty_id: facultyIds[3] },
  ];
  const subjects = await Subject.insertMany(subjectData);
  const subjectIds = subjects.map(s => s._id);
  const cseSubjectIds = [subjectIds[0], subjectIds[1], subjectIds[2], subjectIds[6], subjectIds[7], subjectIds[8], subjectIds[9], subjectIds[10]];
  const eceSubjectIds = [subjectIds[3], subjectIds[4], subjectIds[5], subjectIds[11], subjectIds[12], subjectIds[13], subjectIds[14], subjectIds[15]];

  console.log('Seeding enrollments...');
  const enrollmentData = [];
  for (const sid of cseStudentIds) {
    for (const subId of cseSubjectIds) {
      enrollmentData.push({ student_id: sid, subject_id: subId });
    }
  }
  for (const sid of eceStudentIds) {
    for (const subId of eceSubjectIds) {
      enrollmentData.push({ student_id: sid, subject_id: subId });
    }
  }
  await Enrollment.insertMany(enrollmentData);

  console.log('Seeding timetable...');
  const timetableData = [
    { subject_id: subjectIds[0], day: 'Monday', start_time: '09:00', end_time: '10:30', room: 'J101', semester: 3, faculty_name: 'Prof. Priya Sharma', department: 'CSE', section: 'CSE-A' },
    { subject_id: subjectIds[1], day: 'Monday', start_time: '11:00', end_time: '12:30', room: 'J102', semester: 3, faculty_name: 'Prof. Rahul Verma', department: 'CSE', section: 'CSE-B' },
    { subject_id: subjectIds[0], day: 'Monday', start_time: '14:00', end_time: '15:30', room: 'J103', semester: 3, faculty_name: 'Prof. Priya Sharma', department: 'CSE', section: 'CSE-A' },
    { subject_id: subjectIds[0], day: 'Tuesday', start_time: '09:00', end_time: '10:30', room: 'J101', semester: 3, faculty_name: 'Prof. Priya Sharma', department: 'CSE', section: 'CSE-A' },
    { subject_id: subjectIds[1], day: 'Tuesday', start_time: '14:00', end_time: '15:30', room: 'J102', semester: 3, faculty_name: 'Prof. Rahul Verma', department: 'CSE', section: 'CSE-B' },
    { subject_id: subjectIds[2], day: 'Tuesday', start_time: '14:00', end_time: '15:30', room: 'J104', semester: 5, faculty_name: 'Prof. Anita Rao', department: 'CSE', section: 'CSE-A' },
    { subject_id: subjectIds[1], day: 'Wednesday', start_time: '09:00', end_time: '10:30', room: 'J101', semester: 3, faculty_name: 'Prof. Rahul Verma', department: 'CSE', section: 'CSE-B' },
    { subject_id: subjectIds[0], day: 'Wednesday', start_time: '11:00', end_time: '12:30', room: 'J102', semester: 3, faculty_name: 'Prof. Priya Sharma', department: 'CSE', section: 'CSE-A' },
    { subject_id: subjectIds[2], day: 'Wednesday', start_time: '09:00', end_time: '10:30', room: 'J103', semester: 5, faculty_name: 'Prof. Anita Rao', department: 'CSE', section: 'CSE-A' },
    { subject_id: subjectIds[2], day: 'Thursday', start_time: '09:00', end_time: '10:30', room: 'J101', semester: 5, faculty_name: 'Prof. Anita Rao', department: 'CSE', section: 'CSE-A' },
    { subject_id: subjectIds[0], day: 'Thursday', start_time: '11:00', end_time: '12:30', room: 'J102', semester: 3, faculty_name: 'Prof. Priya Sharma', department: 'CSE', section: 'CSE-A' },
    { subject_id: subjectIds[1], day: 'Thursday', start_time: '14:00', end_time: '15:30', room: 'J104', semester: 3, faculty_name: 'Prof. Rahul Verma', department: 'CSE', section: 'CSE-B' },
    { subject_id: subjectIds[0], day: 'Friday', start_time: '09:00', end_time: '10:30', room: 'J101', semester: 3, faculty_name: 'Prof. Priya Sharma', department: 'CSE', section: 'CSE-A' },
    { subject_id: subjectIds[1], day: 'Friday', start_time: '11:00', end_time: '12:30', room: 'J102', semester: 3, faculty_name: 'Prof. Rahul Verma', department: 'CSE', section: 'CSE-B' },
    { subject_id: subjectIds[3], day: 'Monday', start_time: '09:00', end_time: '10:30', room: 'A101', semester: 3, faculty_name: 'Prof. Suresh Kumar', department: 'ECE', section: 'ECE-A' },
    { subject_id: subjectIds[3], day: 'Monday', start_time: '11:00', end_time: '12:30', room: 'A102', semester: 3, faculty_name: 'Prof. Suresh Kumar', department: 'ECE', section: 'ECE-B' },
    { subject_id: subjectIds[4], day: 'Monday', start_time: '14:00', end_time: '15:30', room: 'A103', semester: 5, faculty_name: 'Prof. Deepa Nair', department: 'ECE', section: 'ECE-A' },
    { subject_id: subjectIds[4], day: 'Tuesday', start_time: '09:00', end_time: '10:30', room: 'A101', semester: 5, faculty_name: 'Prof. Deepa Nair', department: 'ECE', section: 'ECE-A' },
    { subject_id: subjectIds[3], day: 'Tuesday', start_time: '11:00', end_time: '12:30', room: 'A102', semester: 3, faculty_name: 'Prof. Suresh Kumar', department: 'ECE', section: 'ECE-B' },
    { subject_id: subjectIds[4], day: 'Tuesday', start_time: '14:00', end_time: '15:30', room: 'A104', semester: 5, faculty_name: 'Prof. Deepa Nair', department: 'ECE', section: 'ECE-A' },
    { subject_id: subjectIds[3], day: 'Wednesday', start_time: '09:00', end_time: '10:30', room: 'A101', semester: 3, faculty_name: 'Prof. Suresh Kumar', department: 'ECE', section: 'ECE-A' },
    { subject_id: subjectIds[4], day: 'Wednesday', start_time: '11:00', end_time: '12:30', room: 'A102', semester: 5, faculty_name: 'Prof. Deepa Nair', department: 'ECE', section: 'ECE-A' },
    { subject_id: subjectIds[5], day: 'Wednesday', start_time: '14:00', end_time: '15:30', room: 'A103', semester: 7, faculty_name: 'Prof. Suresh Kumar', department: 'ECE', section: 'ECE-A' },
    { subject_id: subjectIds[4], day: 'Thursday', start_time: '09:00', end_time: '10:30', room: 'A101', semester: 5, faculty_name: 'Prof. Deepa Nair', department: 'ECE', section: 'ECE-A' },
    { subject_id: subjectIds[3], day: 'Thursday', start_time: '11:00', end_time: '12:30', room: 'A102', semester: 3, faculty_name: 'Prof. Suresh Kumar', department: 'ECE', section: 'ECE-B' },
    { subject_id: subjectIds[5], day: 'Thursday', start_time: '14:00', end_time: '15:30', room: 'A104', semester: 7, faculty_name: 'Prof. Suresh Kumar', department: 'ECE', section: 'ECE-A' },
    { subject_id: subjectIds[5], day: 'Friday', start_time: '09:00', end_time: '10:30', room: 'A101', semester: 7, faculty_name: 'Prof. Suresh Kumar', department: 'ECE', section: 'ECE-A' },
    { subject_id: subjectIds[5], day: 'Friday', start_time: '11:00', end_time: '12:30', room: 'A102', semester: 7, faculty_name: 'Prof. Suresh Kumar', department: 'ECE', section: 'ECE-A' },
    { subject_id: subjectIds[0], day: 'Monday', start_time: '15:00', end_time: '16:30', room: 'B101', semester: 3, faculty_name: 'Prof. Priya Sharma', department: 'CSE', section: 'CSE-A' },
    { subject_id: subjectIds[1], day: 'Tuesday', start_time: '15:00', end_time: '16:30', room: 'B102', semester: 3, faculty_name: 'Prof. Rahul Verma', department: 'CSE', section: 'CSE-B' },
    { subject_id: subjectIds[2], day: 'Wednesday', start_time: '15:00', end_time: '16:30', room: 'B103', semester: 5, faculty_name: 'Prof. Anita Rao', department: 'CSE', section: 'CSE-A' },
    { subject_id: subjectIds[3], day: 'Thursday', start_time: '15:00', end_time: '16:30', room: 'B104', semester: 3, faculty_name: 'Prof. Suresh Kumar', department: 'ECE', section: 'ECE-A' },
    { subject_id: subjectIds[4], day: 'Friday', start_time: '15:00', end_time: '16:30', room: 'B105', semester: 5, faculty_name: 'Prof. Deepa Nair', department: 'ECE', section: 'ECE-A' },
    { subject_id: subjectIds[6], day: 'Monday', start_time: '08:00', end_time: '09:30', room: 'J105', semester: 1, faculty_name: 'Prof. Priya Sharma', department: 'CSE', section: 'CSE-A' },
    { subject_id: subjectIds[6], day: 'Wednesday', start_time: '08:00', end_time: '09:30', room: 'J106', semester: 1, faculty_name: 'Prof. Priya Sharma', department: 'CSE', section: 'CSE-A' },
    { subject_id: subjectIds[7], day: 'Tuesday', start_time: '08:00', end_time: '09:30', room: 'J105', semester: 2, faculty_name: 'Prof. Rahul Verma', department: 'CSE', section: 'CSE-A' },
    { subject_id: subjectIds[7], day: 'Thursday', start_time: '08:00', end_time: '09:30', room: 'J106', semester: 2, faculty_name: 'Prof. Rahul Verma', department: 'CSE', section: 'CSE-A' },
    { subject_id: subjectIds[8], day: 'Monday', start_time: '10:30', end_time: '12:00', room: 'J107', semester: 4, faculty_name: 'Prof. Anita Rao', department: 'CSE', section: 'CSE-A' },
    { subject_id: subjectIds[8], day: 'Friday', start_time: '10:30', end_time: '12:00', room: 'J108', semester: 4, faculty_name: 'Prof. Anita Rao', department: 'CSE', section: 'CSE-A' },
    { subject_id: subjectIds[9], day: 'Wednesday', start_time: '10:30', end_time: '12:00', room: 'J109', semester: 6, faculty_name: 'Prof. Priya Sharma', department: 'CSE', section: 'CSE-A' },
    { subject_id: subjectIds[9], day: 'Friday', start_time: '08:00', end_time: '09:30', room: 'J110', semester: 6, faculty_name: 'Prof. Priya Sharma', department: 'CSE', section: 'CSE-A' },
    { subject_id: subjectIds[10], day: 'Tuesday', start_time: '10:30', end_time: '12:00', room: 'J109', semester: 8, faculty_name: 'Prof. Rahul Verma', department: 'CSE', section: 'CSE-A' },
    { subject_id: subjectIds[10], day: 'Thursday', start_time: '10:30', end_time: '12:00', room: 'J110', semester: 8, faculty_name: 'Prof. Rahul Verma', department: 'CSE', section: 'CSE-A' },
    { subject_id: subjectIds[11], day: 'Monday', start_time: '08:00', end_time: '09:30', room: 'A105', semester: 1, faculty_name: 'Prof. Suresh Kumar', department: 'ECE', section: 'ECE-A' },
    { subject_id: subjectIds[11], day: 'Wednesday', start_time: '08:00', end_time: '09:30', room: 'A106', semester: 1, faculty_name: 'Prof. Suresh Kumar', department: 'ECE', section: 'ECE-A' },
    { subject_id: subjectIds[12], day: 'Tuesday', start_time: '08:00', end_time: '09:30', room: 'A105', semester: 2, faculty_name: 'Prof. Deepa Nair', department: 'ECE', section: 'ECE-A' },
    { subject_id: subjectIds[12], day: 'Thursday', start_time: '08:00', end_time: '09:30', room: 'A106', semester: 2, faculty_name: 'Prof. Deepa Nair', department: 'ECE', section: 'ECE-A' },
    { subject_id: subjectIds[13], day: 'Monday', start_time: '10:30', end_time: '12:00', room: 'A107', semester: 4, faculty_name: 'Prof. Suresh Kumar', department: 'ECE', section: 'ECE-A' },
    { subject_id: subjectIds[13], day: 'Friday', start_time: '10:30', end_time: '12:00', room: 'A108', semester: 4, faculty_name: 'Prof. Suresh Kumar', department: 'ECE', section: 'ECE-A' },
    { subject_id: subjectIds[14], day: 'Wednesday', start_time: '10:30', end_time: '12:00', room: 'A109', semester: 6, faculty_name: 'Prof. Deepa Nair', department: 'ECE', section: 'ECE-A' },
    { subject_id: subjectIds[14], day: 'Friday', start_time: '08:00', end_time: '09:30', room: 'A110', semester: 6, faculty_name: 'Prof. Deepa Nair', department: 'ECE', section: 'ECE-A' },
    { subject_id: subjectIds[15], day: 'Tuesday', start_time: '10:30', end_time: '12:00', room: 'A109', semester: 8, faculty_name: 'Prof. Suresh Kumar', department: 'ECE', section: 'ECE-A' },
    { subject_id: subjectIds[15], day: 'Thursday', start_time: '10:30', end_time: '12:00', room: 'A110', semester: 8, faculty_name: 'Prof. Suresh Kumar', department: 'ECE', section: 'ECE-A' },
  ];

  const timetableDocs = timetableData.map(t => ({
    ...t,
    updated_by: adminIds[0],
    is_active: 1,
  }));
  await Timetable.insertMany(timetableDocs);

  const historicalTimetable = [
    { subject_id: subjectIds[0], day: 'Monday', start_time: '08:00', end_time: '09:30', room: 'J101', semester: 3, faculty_name: 'Prof. Priya Sharma', department: 'CSE', section: 'CSE-A', is_active: 0, updated_by: adminIds[0] },
    { subject_id: subjectIds[1], day: 'Wednesday', start_time: '10:00', end_time: '11:30', room: 'J102', semester: 3, faculty_name: 'Prof. Rahul Verma', department: 'CSE', section: 'CSE-B', is_active: 0, updated_by: adminIds[1] },
    { subject_id: subjectIds[3], day: 'Tuesday', start_time: '08:00', end_time: '09:30', room: 'A101', semester: 3, faculty_name: 'Prof. Suresh Kumar', department: 'ECE', section: 'ECE-A', is_active: 0, updated_by: adminIds[0] },
    { subject_id: subjectIds[4], day: 'Thursday', start_time: '10:00', end_time: '11:30', room: 'A102', semester: 5, faculty_name: 'Prof. Deepa Nair', department: 'ECE', section: 'ECE-A', is_active: 0, updated_by: adminIds[1] },
    { subject_id: subjectIds[2], day: 'Friday', start_time: '08:00', end_time: '09:30', room: 'B101', semester: 5, faculty_name: 'Prof. Anita Rao', department: 'CSE', section: 'CSE-A', is_active: 0, updated_by: adminIds[0] },
  ];

  const histTimetableDocs = historicalTimetable.map(t => ({
    ...t,
    deactivated_at: new Date(),
  }));
  await Timetable.insertMany(histTimetableDocs);

  console.log('Seeding navigation places...');
  const places = [
    { name: 'J101', block: 'J Block', floor: 'Ground', description: 'Classroom 101 - J Block', landmark_hint: 'First room on the left from J Block entrance', directions_from_gate: '1. Enter from Main Gate\n2. Walk straight 80m along the main pathway\n3. Turn right at the Canteen\n4. J Block is straight ahead\n5. Enter J Block, J101 is the first room on your left', map_x: 65, map_y: 35, category: 'Classroom' },
    { name: 'J102', block: 'J Block', floor: 'Ground', description: 'Classroom 102 - J Block', landmark_hint: 'Next to J101', directions_from_gate: '1. Enter from Main Gate\n2. Walk straight 80m\n3. Turn right at Canteen\n4. Enter J Block\n5. J102 is next to J101, 2nd room on your left', map_x: 65, map_y: 40, category: 'Classroom' },
    { name: 'J103', block: 'J Block', floor: 'Ground', description: 'Classroom 103 - J Block', landmark_hint: 'Opposite the staircase in J Block', directions_from_gate: '1. Enter from Main Gate\n2. Walk straight 80m\n3. Turn right at Canteen\n4. Enter J Block\n5. J103 is on the right side, opposite the staircase', map_x: 70, map_y: 35, category: 'Classroom' },
    { name: 'J104', block: 'J Block', floor: 'First', description: 'Classroom 104 - J Block', landmark_hint: 'Above J101, first floor', directions_from_gate: '1. Enter from Main Gate\n2. Walk straight 80m\n3. Turn right at Canteen\n4. Enter J Block, take staircase to first floor\n5. J104 is the first room on your left', map_x: 65, map_y: 30, category: 'Classroom' },
    { name: 'J105', block: 'J Block', floor: 'First', description: 'Classroom 105 - J Block', landmark_hint: 'Next to J104', directions_from_gate: '1. Enter from Main Gate\n2. Walk straight 80m\n3. Turn right at Canteen\n4. Enter J Block, go to first floor\n5. J105 is next to J104', map_x: 65, map_y: 25, category: 'Classroom' },
    { name: 'J106', block: 'J Block', floor: 'First', description: 'Classroom 106 - J Block', landmark_hint: 'Opposite J105', directions_from_gate: '1. Enter from Main Gate\n2. Walk straight 80m\n3. Turn right at Canteen\n4. Enter J Block, go to first floor\n5. J106 is opposite J105', map_x: 70, map_y: 25, category: 'Classroom' },
    { name: 'J107', block: 'J Block', floor: 'Second', description: 'Classroom 107 - J Block', landmark_hint: 'Above J104, second floor', directions_from_gate: '1. Enter from Main Gate\n2. Walk straight 80m\n3. Turn right at Canteen\n4. Enter J Block, take stairs to second floor\n5. J107 is the first room on left', map_x: 60, map_y: 30, category: 'Classroom' },
    { name: 'J108', block: 'J Block', floor: 'Second', description: 'Classroom 108 - J Block', landmark_hint: 'Next to J107', directions_from_gate: '1. Enter from Main Gate\n2. Walk straight 80m\n3. Turn right at Canteen\n4. Enter J Block, go to second floor\n5. J108 is next to J107', map_x: 60, map_y: 35, category: 'Classroom' },
    { name: 'J109', block: 'J Block', floor: 'Second', description: 'Classroom 109 - J Block', landmark_hint: 'End of corridor, J Block second floor', directions_from_gate: '1. Enter from Main Gate\n2. Walk straight 80m\n3. Turn right at Canteen\n4. Enter J Block, go to second floor\n5. J109 is at the end of the corridor', map_x: 60, map_y: 40, category: 'Classroom' },
    { name: 'J110', block: 'J Block', floor: 'Second', description: 'Classroom 110 - J Block', landmark_hint: 'Opposite J109', directions_from_gate: '1. Enter from Main Gate\n2. Walk straight 80m\n3. Turn right at Canteen\n4. Enter J Block, go to second floor\n5. J110 is opposite J109', map_x: 55, map_y: 40, category: 'Classroom' },
    { name: 'A101', block: 'A Block', floor: 'Ground', description: 'Classroom 101 - A Block', landmark_hint: 'Left wing of A Block, ground floor', directions_from_gate: '1. Enter from Main Gate\n2. Walk straight 50m\n3. Turn left at the fountain\n4. A Block is on the left\n5. Enter A Block, A101 is the first room on your right', map_x: 25, map_y: 50, category: 'Classroom' },
    { name: 'A102', block: 'A Block', floor: 'Ground', description: 'Classroom 102 - A Block', landmark_hint: 'Next to A101', directions_from_gate: '1. Enter from Main Gate\n2. Walk straight 50m\n3. Turn left at the fountain\n4. Enter A Block\n5. A102 is next to A101', map_x: 25, map_y: 55, category: 'Classroom' },
    { name: 'A103', block: 'A Block', floor: 'First', description: 'Classroom 103 - A Block', landmark_hint: 'Above A101, first floor', directions_from_gate: '1. Enter from Main Gate\n2. Walk straight 50m\n3. Turn left at the fountain\n4. Enter A Block, go to first floor\n5. A103 is above A101', map_x: 20, map_y: 50, category: 'Classroom' },
    { name: 'A104', block: 'A Block', floor: 'First', description: 'Classroom 104 - A Block', landmark_hint: 'Next to A103', directions_from_gate: '1. Enter from Main Gate\n2. Walk straight 50m\n3. Turn left at the fountain\n4. Enter A Block, go to first floor\n5. A104 is next to A103', map_x: 20, map_y: 55, category: 'Classroom' },
    { name: 'A105', block: 'A Block', floor: 'First', description: 'Classroom 105 - A Block', landmark_hint: 'End of corridor, A Block first floor', directions_from_gate: '1. Enter from Main Gate\n2. Walk straight 50m\n3. Turn left at the fountain\n4. Enter A Block, go to first floor\n5. A105 is at the end of the corridor', map_x: 20, map_y: 60, category: 'Classroom' },
    { name: 'A106', block: 'A Block', floor: 'Second', description: 'Classroom 106 - A Block', landmark_hint: 'Above A103, second floor', directions_from_gate: '1. Enter from Main Gate\n2. Walk straight 50m\n3. Turn left at the fountain\n4. Enter A Block, take stairs to second floor\n5. A106 is the first room', map_x: 15, map_y: 50, category: 'Classroom' },
    { name: 'A107', block: 'A Block', floor: 'Second', description: 'Classroom 107 - A Block', landmark_hint: 'Next to A106', directions_from_gate: '1. Enter from Main Gate\n2. Walk straight 50m\n3. Turn left at the fountain\n4. Enter A Block, go to second floor\n5. A107 is next to A106', map_x: 15, map_y: 55, category: 'Classroom' },
    { name: 'A108', block: 'A Block', floor: 'Second', description: 'Classroom 108 - A Block', landmark_hint: 'Opposite staircase, A Block second floor', directions_from_gate: '1. Enter from Main Gate\n2. Walk straight 50m\n3. Turn left at the fountain\n4. Enter A Block, go to second floor\n5. A108 is opposite the staircase', map_x: 15, map_y: 60, category: 'Classroom' },
    { name: 'A109', block: 'A Block', floor: 'Second', description: 'Classroom 109 - A Block', landmark_hint: 'End of corridor, second floor', directions_from_gate: '1. Enter from Main Gate\n2. Walk straight 50m\n3. Turn left at the fountain\n4. Enter A Block, go to second floor\n5. A109 is at the far end', map_x: 15, map_y: 65, category: 'Classroom' },
    { name: 'A110', block: 'A Block', floor: 'Third', description: 'Classroom 110 - A Block', landmark_hint: 'Top floor, A Block', directions_from_gate: '1. Enter from Main Gate\n2. Walk straight 50m\n3. Turn left at the fountain\n4. Enter A Block, take stairs to third floor\n5. A110 is the only room on this floor', map_x: 10, map_y: 55, category: 'Classroom' },
    { name: 'B101', block: 'B Block', floor: 'Ground', description: 'Classroom 101 - B Block', landmark_hint: 'Behind the Admin Office', directions_from_gate: '1. Enter from Main Gate\n2. Walk straight 30m\n3. Turn right at the Admin Office\n4. B Block is directly behind Admin Office\n5. B101 is the first room on the right', map_x: 45, map_y: 70, category: 'Classroom' },
    { name: 'B102', block: 'B Block', floor: 'Ground', description: 'Classroom 102 - B Block', landmark_hint: 'Next to B101', directions_from_gate: '1. Enter from Main Gate\n2. Walk straight 30m\n3. Turn right at Admin Office\n4. Enter B Block\n5. B102 is next to B101', map_x: 45, map_y: 75, category: 'Classroom' },
    { name: 'B103', block: 'B Block', floor: 'Ground', description: 'Classroom 103 - B Block', landmark_hint: 'Opposite the lounge area', directions_from_gate: '1. Enter from Main Gate\n2. Walk straight 30m\n3. Turn right at Admin Office\n4. Enter B Block\n5. B103 is on the left side, opposite the lounge', map_x: 50, map_y: 70, category: 'Classroom' },
    { name: 'B104', block: 'B Block', floor: 'First', description: 'Classroom 104 - B Block', landmark_hint: 'Above B101, first floor', directions_from_gate: '1. Enter from Main Gate\n2. Walk straight 30m\n3. Turn right at Admin Office\n4. Enter B Block, take stairs to first floor\n5. B104 is above B101', map_x: 45, map_y: 65, category: 'Classroom' },
    { name: 'B105', block: 'B Block', floor: 'First', description: 'Classroom 105 - B Block', landmark_hint: 'Next to B104', directions_from_gate: '1. Enter from Main Gate\n2. Walk straight 30m\n3. Turn right at Admin Office\n4. Enter B Block, go to first floor\n5. B105 is next to B104', map_x: 45, map_y: 60, category: 'Classroom' },
    { name: 'B106', block: 'B Block', floor: 'First', description: 'Classroom 106 - B Block', landmark_hint: 'End of corridor, B Block first floor', directions_from_gate: '1. Enter from Main Gate\n2. Walk straight 30m\n3. Turn right at Admin Office\n4. Enter B Block, go to first floor\n5. B106 is at the end', map_x: 50, map_y: 60, category: 'Classroom' },
    { name: 'B107', block: 'B Block', floor: 'Second', description: 'Classroom 107 - B Block', landmark_hint: 'Above B104, second floor', directions_from_gate: '1. Enter from Main Gate\n2. Walk straight 30m\n3. Turn right at Admin Office\n4. Enter B Block, take stairs to second floor\n5. B107 is above B104', map_x: 40, map_y: 65, category: 'Classroom' },
    { name: 'B108', block: 'B Block', floor: 'Second', description: 'Classroom 108 - B Block', landmark_hint: 'Next to B107', directions_from_gate: '1. Enter from Main Gate\n2. Walk straight 30m\n3. Turn right at Admin Office\n4. Enter B Block, go to second floor\n5. B108 is next to B107', map_x: 40, map_y: 70, category: 'Classroom' },
    { name: 'B109', block: 'B Block', floor: 'Second', description: 'Classroom 109 - B Block', landmark_hint: 'Near the terrace access', directions_from_gate: '1. Enter from Main Gate\n2. Walk straight 30m\n3. Turn right at Admin Office\n4. Enter B Block, go to second floor\n5. B109 is near the terrace door', map_x: 40, map_y: 75, category: 'Classroom' },
    { name: 'B110', block: 'B Block', floor: 'Second', description: 'Classroom 110 - B Block', landmark_hint: 'Opposite B109', directions_from_gate: '1. Enter from Main Gate\n2. Walk straight 30m\n3. Turn right at Admin Office\n4. Enter B Block, go to second floor\n5. B110 is opposite B109', map_x: 35, map_y: 75, category: 'Classroom' },
    { name: 'Library', block: 'Central Block', floor: 'Ground & First', description: 'Central Library with vast collection of books, journals, and digital resources', landmark_hint: 'Opposite the Admin Office, next to the Auditorium', directions_from_gate: '1. Enter from Main Gate\n2. Walk straight 40m\n3. Library is the large building on your right\n4. Entrance is on the ground floor', map_x: 50, map_y: 30, category: 'Facility' },
    { name: 'Computer Lab 1', block: 'J Block', floor: 'Ground', description: 'Computer Lab with 60 systems', landmark_hint: 'Behind J Block, ground floor, right wing', directions_from_gate: '1. Enter from Main Gate\n2. Walk straight 80m\n3. Turn right at Canteen\n4. Walk past J Block\n5. Computer Lab 1 is in the annex behind J Block', map_x: 75, map_y: 35, category: 'Lab' },
    { name: 'Computer Lab 2', block: 'J Block', floor: 'First', description: 'Advanced Computing Lab', landmark_hint: 'Above Computer Lab 1, first floor', directions_from_gate: '1. Enter from Main Gate\n2. Walk straight 80m\n3. Turn right at Canteen\n4. Walk behind J Block\n5. Take stairs to first floor - Computer Lab 2 is above Lab 1', map_x: 75, map_y: 30, category: 'Lab' },
    { name: 'Electronics Lab', block: 'A Block', floor: 'Ground', description: 'Electronics and Circuit Lab', landmark_hint: 'Behind A Block, left wing', directions_from_gate: '1. Enter from Main Gate\n2. Walk straight 50m\n3. Turn left at the fountain\n4. Walk past A Block\n5. Electronics Lab is in the annex behind A Block', map_x: 25, map_y: 40, category: 'Lab' },
    { name: 'Physics Lab', block: 'Central Block', floor: 'First', description: 'Physics Laboratory', landmark_hint: 'Above the Library, first floor', directions_from_gate: '1. Enter from Main Gate\n2. Walk straight 40m\n3. Library building on your right\n4. Take stairs to first floor\n5. Physics Lab is on the first floor, left wing', map_x: 50, map_y: 25, category: 'Lab' },
    { name: 'Chemistry Lab', block: 'Central Block', floor: 'First', description: 'Chemistry Laboratory', landmark_hint: 'Next to Physics Lab, first floor', directions_from_gate: '1. Enter from Main Gate\n2. Walk straight 40m\n3. Library building on your right\n4. Take stairs to first floor\n5. Chemistry Lab is next to Physics Lab, right wing', map_x: 55, map_y: 25, category: 'Lab' },
    { name: 'Admin Office', block: 'Central Block', floor: 'Ground', description: 'Main Administrative Office', landmark_hint: 'Central building, directly facing the Main Gate', directions_from_gate: '1. Enter from Main Gate\n2. Walk straight 30m\n3. Admin Office is the large central building straight ahead\n4. Main entrance is through the glass doors', map_x: 45, map_y: 45, category: 'Office' },
    { name: 'Principal Office', block: 'Central Block', floor: 'Second', description: 'Office of the Principal', landmark_hint: 'Above Admin Office, second floor', directions_from_gate: '1. Enter from Main Gate\n2. Walk straight 30m\n3. Enter the Central Block\n4. Take the elevator or stairs to the second floor\n5. Principal Office is at the end of the corridor', map_x: 45, map_y: 40, category: 'Office' },
    { name: 'Canteen', block: 'Central Block', floor: 'Ground', description: 'Main Campus Canteen', landmark_hint: 'Next to the Central Block, near the pathway to J Block', directions_from_gate: '1. Enter from Main Gate\n2. Walk straight 20m\n3. Turn right at the pathway\n4. Canteen is on your right, just before the turn to J Block', map_x: 55, map_y: 45, category: 'Facility' },
    { name: 'Cafeteria', block: 'Near A Block', floor: 'Ground', description: 'Student Cafeteria', landmark_hint: 'Opposite A Block, near the fountain', directions_from_gate: '1. Enter from Main Gate\n2. Walk straight 50m\n3. Cafeteria is opposite A Block\n4. Located right next to the fountain', map_x: 30, map_y: 50, category: 'Facility' },
    { name: 'Auditorium', block: 'Central Block', floor: 'Ground', description: 'Main Auditorium seating 500', landmark_hint: 'Next to the Library, right wing', directions_from_gate: '1. Enter from Main Gate\n2. Walk straight 40m\n3. Turn right at the Library\n4. Auditorium is the large domed building next to the Library', map_x: 55, map_y: 35, category: 'Facility' },
    { name: 'Seminar Hall 1', block: 'Central Block', floor: 'First', description: 'Seminar Hall with 100 seats', landmark_hint: 'Above the Admin Office, first floor', directions_from_gate: '1. Enter from Main Gate\n2. Walk straight 30m\n3. Enter Central Block\n4. Take stairs to first floor\n5. Seminar Hall 1 is on the left side', map_x: 40, map_y: 45, category: 'Facility' },
    { name: 'Seminar Hall 2', block: 'Central Block', floor: 'First', description: 'Seminar Hall with 80 seats', landmark_hint: 'Opposite Seminar Hall 1', directions_from_gate: '1. Enter from Main Gate\n2. Walk straight 30m\n3. Enter Central Block\n4. Take stairs to first floor\n5. Seminar Hall 2 is opposite Seminar Hall 1, right side', map_x: 50, map_y: 45, category: 'Facility' },
    { name: 'Boys Hostel', block: 'North Campus', floor: '3 Floors', description: 'Boys Hostel with 200 rooms', landmark_hint: 'Behind the sports ground, north end', directions_from_gate: '1. Enter from Main Gate\n2. Walk straight 100m through the campus\n3. Pass the Sports Ground on your left\n4. Boys Hostel is the large building at the north end', map_x: 80, map_y: 10, category: 'Hostel' },
    { name: 'Girls Hostel', block: 'East Campus', floor: '3 Floors', description: 'Girls Hostel with 150 rooms', landmark_hint: 'Near the east boundary wall, behind B Block', directions_from_gate: '1. Enter from Main Gate\n2. Walk straight 30m, turn right at Admin Office\n3. Walk past B Block\n4. Girls Hostel is at the east end, near the boundary wall', map_x: 35, map_y: 80, category: 'Hostel' },
    { name: 'Parking Area', block: 'South Campus', floor: 'Ground', description: 'Main Parking Area for staff and students', landmark_hint: 'Just inside the Main Gate, left side', directions_from_gate: '1. Enter from Main Gate\n2. Parking Area is immediately on your left\n3. Covers the entire area adjacent to the entrance road', map_x: 40, map_y: 90, category: 'Facility' },
    { name: 'Medical Centre', block: 'Central Block', floor: 'Ground', description: 'Campus Medical Centre', landmark_hint: 'Behind the Admin Office, ground floor', directions_from_gate: '1. Enter from Main Gate\n2. Walk straight 30m\n3. Walk around the Admin Office to the back\n4. Medical Centre is on the ground floor, rear side', map_x: 45, map_y: 50, category: 'Facility' },
    { name: 'Sports Ground', block: 'North Campus', floor: 'Ground', description: 'Main Sports Ground with football field and track', landmark_hint: 'Between Central Block and Boys Hostel', directions_from_gate: '1. Enter from Main Gate\n2. Walk straight 70m through the campus\n3. Sports Ground is the open area on your left\n4. Accessible via the pathway next to the Library', map_x: 70, map_y: 20, category: 'Facility' },
    { name: 'Main Gate', block: 'South Campus', floor: 'Ground', description: 'Main Entrance Gate of the Campus', landmark_hint: 'Southern entrance to the campus', directions_from_gate: '1. You are at the Main Gate\n2. The campus entrance is here\n3. Parking is to your left\n4. The main pathway leads straight ahead', map_x: 45, map_y: 95, category: 'Entrance' },
    { name: 'Back Gate', block: 'North Campus', floor: 'Ground', description: 'Back Entrance of the Campus', landmark_hint: 'Near the Boys Hostel, north side', directions_from_gate: '1. Enter from Main Gate\n2. Walk straight 120m through the entire campus\n3. Pass the Sports Ground and Boys Hostel\n4. Back Gate is at the north end, behind Boys Hostel', map_x: 80, map_y: 5, category: 'Entrance' },
  ];
  await NavigationPlace.insertMany(places);

  console.log('Seeding lost & found items...');
  const now = new Date();
  const daysAgo = (n) => {
    const d = new Date(now);
    d.setDate(d.getDate() - n);
    return d;
  };
  const daysFromNow = (n) => {
    const d = new Date(now);
    d.setDate(d.getDate() + n);
    return d;
  };

  const lostItemData = [
    { posted_by: studentIds[0], type: 'Lost', item_name: 'Blue Wireless Headphones', description: 'Sony WH-1000XM4 noise cancelling headphones in blue. Left earcup has a small scratch.', category: 'Electronics', date_occurred: daysAgo(2), location: 'Library - 2nd floor reading area', image_path: null, contact_info: 'student1@campus.com', where_item_now: null, status: 'Active', created_at: daysAgo(2), expires_at: daysFromNow(28) },
    { posted_by: studentIds[2], type: 'Lost', item_name: 'Black Laptop Bag', description: 'HP laptop bag, black colour, contains a small pouch with pens inside.', category: 'Bag', date_occurred: daysAgo(5), location: 'Computer Lab 1', image_path: null, contact_info: 'student3@campus.com', where_item_now: null, status: 'Active', created_at: daysAgo(5), expires_at: daysFromNow(25) },
    { posted_by: studentIds[5], type: 'Lost', item_name: 'Student ID Card - 21CSE006', description: 'Name: Student 6 CSE, Register Number: 21CSE006', category: 'ID Card', date_occurred: daysAgo(1), location: 'Canteen area', image_path: null, contact_info: 'student6@campus.com', where_item_now: null, status: 'Active', created_at: daysAgo(1), expires_at: daysFromNow(29) },
    { posted_by: studentIds[3], type: 'Lost', item_name: 'Silver Water Bottle', description: 'Milton thermosteel water bottle, silver colour, 1 litre capacity.', category: 'Other', date_occurred: daysAgo(10), location: 'J Block - J101 classroom', image_path: null, contact_info: null, where_item_now: null, status: 'Active', created_at: daysAgo(10), expires_at: daysFromNow(20) },
    { posted_by: studentIds[7], type: 'Lost', item_name: 'Scientific Calculator', description: 'Casio fx-991ES Plus calculator, black. Stored in a blue zipper case.', category: 'Electronics', date_occurred: daysAgo(3), location: 'Physics Lab', image_path: null, contact_info: 'student8@campus.com', where_item_now: null, status: 'Active', created_at: daysAgo(3), expires_at: daysFromNow(27) },
    { posted_by: studentIds[1], type: 'Lost', item_name: 'Blue Hoodie', description: 'Navy blue Adidas hoodie, size M. Has a small logo on the front.', category: 'Clothing', date_occurred: daysAgo(7), location: 'Sports Ground', image_path: null, contact_info: null, where_item_now: null, status: 'Active', created_at: daysAgo(7), expires_at: daysFromNow(23) },
    { posted_by: studentIds[4], type: 'Lost', item_name: 'Old Textbook - DS', description: 'Data Structures textbook by Narasimha Karumanchi, used condition.', category: 'Books', date_occurred: daysAgo(45), location: 'Library', image_path: null, contact_info: null, where_item_now: null, status: 'Expired', created_at: daysAgo(45), expires_at: daysAgo(15) },
    { posted_by: studentIds[8], type: 'Lost', item_name: 'Red Umbrella', description: 'Red and black striped umbrella, foldable type.', category: 'Other', date_occurred: daysAgo(35), location: 'Cafeteria', image_path: null, contact_info: null, where_item_now: null, status: 'Expired', created_at: daysAgo(35), expires_at: daysAgo(5) },
    { posted_by: studentIds[6], type: 'Lost', item_name: 'House Keys', description: 'Set of 3 keys on a blue keychain with a small elephant charm.', category: 'Keys', date_occurred: daysAgo(50), location: 'Parking Area', image_path: null, contact_info: null, where_item_now: null, status: 'Expired', created_at: daysAgo(50), expires_at: daysAgo(20) },
    { posted_by: studentIds[9], type: 'Lost', item_name: 'Gold Earring', description: 'Small gold hoop earring, left ear. Sentimental value.', category: 'Jewellery', date_occurred: daysAgo(60), location: 'Auditorium', image_path: null, contact_info: 'student10@campus.com', where_item_now: null, status: 'Expired', created_at: daysAgo(60), expires_at: daysAgo(30) },
  ];
  await LostFoundItem.insertMany(lostItemData);

  const foundItemData = [
    { posted_by: studentIds[5], type: 'Found', item_name: 'Black Wallet', description: 'Black leather wallet found near the Canteen counter. Contains some cash but no ID.', category: 'Other', date_occurred: daysAgo(1), location: 'Canteen', image_path: null, contact_info: 'student6@campus.com', where_item_now: 'I have it with me', status: 'Active', created_at: daysAgo(1), expires_at: daysFromNow(29) },
    { posted_by: facultyIds[0], type: 'Found', item_name: 'USB Drive - 32GB', description: 'Black Sandisk USB 3.0 drive found on desk in J101.', category: 'Electronics', date_occurred: daysAgo(2), location: 'J101 Classroom', image_path: null, contact_info: 'faculty1@campus.com', where_item_now: 'Submitted to Admin Office', status: 'Active', created_at: daysAgo(2), expires_at: daysFromNow(28) },
    { posted_by: studentIds[1], type: 'Found', item_name: 'Prescription Glasses', description: 'Black frame glasses with blue-light filter lenses. Found near the Library entrance.', category: 'Other', date_occurred: daysAgo(4), location: 'Library entrance', image_path: null, contact_info: 'student2@campus.com', where_item_now: 'I have it with me', status: 'Active', created_at: daysAgo(4), expires_at: daysFromNow(26) },
    { posted_by: studentIds[3], type: 'Found', item_name: 'CSE Textbook - Algorithms', description: 'Introduction to Algorithms - CLRS. Name written inside: "Rahul".', category: 'Books', date_occurred: daysAgo(6), location: 'J102 Classroom', image_path: null, contact_info: null, where_item_now: 'Submitted to Admin Office', status: 'Active', created_at: daysAgo(6), expires_at: daysFromNow(24) },
    { posted_by: studentIds[7], type: 'Found', item_name: 'Blue Sports Water Bottle', description: 'Blue plastic sports bottle with straw. Found near Sports Ground.', category: 'Other', date_occurred: daysAgo(8), location: 'Sports Ground', image_path: null, contact_info: null, where_item_now: 'I have it with me', status: 'Active', created_at: daysAgo(8), expires_at: daysFromNow(22) },
    { posted_by: facultyIds[2], type: 'Found', item_name: 'ID Card - Student 3', description: 'ID card of Student 3 CSE (21CSE003) found near the Admin Office.', category: 'ID Card', date_occurred: daysAgo(3), location: 'Admin Office corridor', image_path: null, contact_info: 'faculty3@campus.com', where_item_now: 'Submitted to Admin Office', status: 'Active', created_at: daysAgo(3), expires_at: daysFromNow(27) },
    { posted_by: studentIds[0], type: 'Found', item_name: 'White Earphones', description: 'Apple wired EarPods with lightning connector. Found in J Block corridor.', category: 'Electronics', date_occurred: daysAgo(15), location: 'J Block corridor', image_path: null, contact_info: 'student1@campus.com', where_item_now: 'I have it with me', status: 'Claimed', created_at: daysAgo(15), expires_at: daysFromNow(15) },
    { posted_by: studentIds[4], type: 'Found', item_name: 'Black Notebook', description: '150 page ruled notebook with "CSE Notes" written on cover. Found in A101.', category: 'Books', date_occurred: daysAgo(20), location: 'A101 Classroom', image_path: null, contact_info: null, where_item_now: 'Submitted to Admin Office', status: 'Active', created_at: daysAgo(20), expires_at: daysFromNow(10) },
  ];
  const foundItems = await LostFoundItem.insertMany(foundItemData);

  console.log('Seeding lost & found claims...');
  const claimedEarphones = await LostFoundItem.findOne({ type: 'Found', status: 'Claimed' });
  const firstActiveFound = await LostFoundItem.findOne({ type: 'Found', status: 'Active' });

  if (firstActiveFound && claimedEarphones) {
    const claimDocs = [
      { item_id: firstActiveFound._id, claimant_id: studentIds[1], claim_description: 'I lost my black leather wallet near the Canteen last Monday. It has a small scratch on the left corner. I can describe the contents if needed.', proof_image_path: null, status: 'Pending', submitted_at: daysAgo(0), resolved_at: null },
      { item_id: claimedEarphones._id, claimant_id: studentIds[3], claim_description: 'These are my white Apple EarPods. I lost them near J Block last week. The serial number should match.', proof_image_path: null, status: 'Approved', submitted_at: daysAgo(14), resolved_at: daysAgo(13) },
      { item_id: claimedEarphones._id, claimant_id: studentIds[6], claim_description: 'I think these might be mine but I am not sure. I lost earphones too.', proof_image_path: null, status: 'Rejected', submitted_at: daysAgo(14), resolved_at: daysAgo(13) },
    ];
    await LostFoundClaim.insertMany(claimDocs);
  }

  console.log('Seeding attendance records (30 days per student per subject)...');
  const statuses = ['Present', 'Present', 'Present', 'Present', 'Present', 'Present', 'Absent', 'Late'];
  const startDate = new Date('2025-01-15');
  const attendanceBatch = [];

  for (let d = 0; d < 30; d++) {
    const dateObj = new Date(startDate);
    dateObj.setDate(dateObj.getDate() + d);
    if (dateObj.getDay() === 0 || dateObj.getDay() === 6) continue;
    const dateStr = dateObj.toISOString().split('T')[0];

    for (const sid of studentIds) {
      const deptSubjects = cseStudentIds.includes(sid) ? cseSubjectIds : eceSubjectIds;
      for (const subId of deptSubjects) {
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        attendanceBatch.push({ student_id: sid, subject_id: subId, date: dateStr, status });
      }
    }
  }

  try {
    await Attendance.insertMany(attendanceBatch, { ordered: false });
  } catch (e) {
    console.log('  (some duplicate attendance records skipped)');
  }

  console.log('Seeding marks records...');
  const markTypes = ['Mid', 'Final', 'Assignment'];
  const markScores = { Mid: { max: 50, get: () => Math.floor(Math.random() * 31) + 20 }, Final: { max: 100, get: () => Math.floor(Math.random() * 41) + 60 }, Assignment: { max: 20, get: () => Math.floor(Math.random() * 11) + 10 } };
  const marksBatch = [];
  for (const sid of studentIds) {
    const deptSubjects = cseStudentIds.includes(sid) ? cseSubjectIds : eceSubjectIds;
    for (const subId of deptSubjects) {
      const subject = subjects.find(s => s._id.equals(subId));
      for (const examType of markTypes) {
        const score = markScores[examType];
        marksBatch.push({
          student_id: sid, subject_id: subId,
          exam_type: examType, marks_obtained: score.get(),
          max_marks: score.max, semester: subject.semester,
        });
      }
    }
  }
  try {
    await Marks.insertMany(marksBatch, { ordered: false });
  } catch (e) {
    console.log('  (some duplicate marks records skipped)');
  }

  console.log('Seeding notices...');
  const noticeData = [
    { title: 'Mid-Semester Exam Schedule', body: 'Mid-semester examinations will begin from March 15. Please check the exam portal for your personalized timetable.', category: 'Exam', posted_by: adminIds[0], target_role: 'all', created_at: new Date('2025-02-01T09:00:00') },
    { title: 'Annual Tech Fest - Synapse 2025', body: 'Get ready for the annual technical festival Synapse 2025! Registrations are open until Feb 28. Participate in coding competitions, robotics, and more.', category: 'Event', posted_by: adminIds[0], target_role: 'all', created_at: new Date('2025-02-05T10:30:00') },
    { title: 'Holiday on March 8', body: 'The campus will remain closed on March 8 on account of Holi. All classes scheduled for that day will be rescheduled.', category: 'Holiday', posted_by: adminIds[0], target_role: 'all', created_at: new Date('2025-02-10T08:00:00') },
    { title: 'Library Timings Extended', body: 'The central library will remain open until 10 PM during the exam season starting March 1. Weekend timings remain unchanged.', category: 'General', posted_by: facultyIds[0], target_role: 'all', created_at: new Date('2025-02-12T14:00:00') },
    { title: 'Project Submission Deadline', body: 'All final year project reports must be submitted by April 10. Late submissions will incur a penalty of 5 marks per day.', category: 'Exam', posted_by: adminIds[1], target_role: 'student', created_at: new Date('2025-02-15T11:00:00') },
    { title: 'Faculty Development Workshop', body: 'A two-day workshop on AI in Education will be held on March 5-6. All faculty members are expected to attend.', category: 'Event', posted_by: adminIds[0], target_role: 'faculty', created_at: new Date('2025-02-18T09:30:00') },
    { title: 'Summer Vacation Notice', body: 'Summer break will commence from May 1. The campus will reopen on June 15 for the new academic session.', category: 'Holiday', posted_by: adminIds[0], target_role: 'all', created_at: new Date('2025-02-20T10:00:00') },
    { title: 'Hostel Accommodation Registration', body: 'Hostel registration for the next semester is now open. Apply through the student portal before March 20.', category: 'General', posted_by: adminIds[1], target_role: 'student', created_at: new Date('2025-02-22T13:00:00') },
    { title: 'Sports Day Announcement', body: 'The annual Sports Day will be held on March 25. Interested students should register with their respective department coordinators.', category: 'Event', posted_by: facultyIds[1], target_role: 'all', created_at: new Date('2025-02-25T08:00:00') },
    { title: 'Campus Maintenance Notice', body: 'The main building will undergo electrical maintenance on March 2 (Sunday). Access will be restricted between 8 AM and 5 PM.', category: 'General', posted_by: adminIds[0], target_role: 'all', created_at: new Date('2025-02-26T15:00:00') },
    { title: 'Assignment Submission for DS', body: 'All students are reminded to submit their Data Structures assignment by March 5. Late submissions will not be accepted.', category: 'Exam', posted_by: facultyIds[0], target_role: 'student', created_at: new Date('2025-02-27T10:00:00') },
    { title: 'Blood Donation Camp', body: 'A blood donation camp is being organized by the NSS unit on March 10. Donate blood and save lives!', category: 'Event', posted_by: facultyIds[2], target_role: 'all', created_at: new Date('2025-02-28T09:00:00') },
  ];
  await Notice.insertMany(noticeData);

  console.log('');
  console.log('=== SEED COMPLETE ===');
  console.log('');
  console.log('Test Credentials:');
  console.log('  Admin:    admin@campus.com / admin123');
  console.log('  Admin:    admn@project.com / password123');
  console.log('  Faculty:  FAC001 / faculty123 (Prof. Priya Sharma)');
  console.log('  Faculty:  FAC002 / faculty123 (Prof. Rahul Verma)');
  console.log('  Faculty:  FAC003 / faculty123 (Prof. Anita Rao)');
  console.log('  Faculty:  FAC004 / faculty123 (Prof. Suresh Kumar)');
  console.log('  Faculty:  FAC005 / faculty123 (Prof. Deepa Nair)');
  console.log('  Student:  22CSE001 / student123');
  console.log('  Student:  22CSE002 / student123');
  console.log('  Student:  22ECE001 / student123');
  console.log('  Student:  25ECE010 / student123');
  console.log('');
  console.log('Login Instructions:');
  console.log('  Admin:    Use email');
  console.log('  Student:  Use Register Number (e.g. 22CSE001)');
  console.log('  Faculty:  Use Staff ID (e.g. FAC001)');
  console.log('');

  process.exit(0);
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
