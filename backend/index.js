require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { getDB } = require('./db/database');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const subjectRoutes = require('./routes/subjects');
const timetableRoutes = require('./routes/timetable');
const attendanceRoutes = require('./routes/attendance');
const marksRoutes = require('./routes/marks');
const noticesRoutes = require('./routes/notices');
const reportsRoutes = require('./routes/reports');
const classroomRoutes = require('./routes/classroom');
const navigationRoutes = require('./routes/navigation');
const lostFoundRoutes = require('./routes/lostfound');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

getDB();

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/marks', marksRoutes);
app.use('/api/notices', noticesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/classroom', classroomRoutes);
app.use('/api/navigation', navigationRoutes);
app.use('/api/lost-found', lostFoundRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server with expiry check
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  const db = getDB();
  const expired = db.prepare(
    "UPDATE lost_found_items SET status = 'Expired' WHERE status = 'Active' AND expires_at IS NOT NULL AND expires_at <= datetime('now')"
  ).run();
  if (expired.changes > 0) {
    console.log(`Marked ${expired.changes} lost & found items as expired`);
  }
});
