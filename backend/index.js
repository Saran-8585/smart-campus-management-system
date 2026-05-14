require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { getDB } = require('./db/database');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const subjectRoutes = require('./routes/subjects');
const timetableRoutes = require('./routes/timetable');
const attendanceRoutes = require('./routes/attendance');
const marksRoutes = require('./routes/marks');
const noticesRoutes = require('./routes/notices');
const reportsRoutes = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

getDB();

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/marks', marksRoutes);
app.use('/api/notices', noticesRoutes);
app.use('/api/reports', reportsRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
