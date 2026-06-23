require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./db/mongoose');
const LostFoundItem = require('./models/LostFoundItem');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const subjectRoutes = require('./routes/subjects');
const timetableRoutes = require('./routes/timetable');
const attendanceRoutes = require('./routes/attendance');
const noticesRoutes = require('./routes/notices');
const reportsRoutes = require('./routes/reports');
const classroomRoutes = require('./routes/classroom');
const navigationRoutes = require('./routes/navigation');
const lostFoundRoutes = require('./routes/lostfound');
const marksRoutes = require('./routes/marks');
const roomRoutes = require('./routes/room');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/notices', noticesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/classroom', classroomRoutes);
app.use('/api/navigation', navigationRoutes);
app.use('/api/lost-found', lostFoundRoutes);
app.use('/api/marks', marksRoutes);
app.use('/api/rooms', roomRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

connectDB().then(() => {
  app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);

    const expired = await LostFoundItem.updateMany(
      { status: 'Active', expires_at: { $lte: new Date() } },
      { $set: { status: 'Expired' } }
    );
    if (expired.modifiedCount > 0) {
      console.log(`Marked ${expired.modifiedCount} lost & found items as expired`);
    }

    setInterval(async () => {
      const result = await LostFoundItem.updateMany(
        { status: 'Active', expires_at: { $lte: new Date() } },
        { $set: { status: 'Expired' } }
      );
      if (result.modifiedCount > 0) {
        console.log(`Marked ${result.modifiedCount} lost & found items as expired`);
      }
    }, 60 * 60 * 1000);
  });
});
