const Attendance = require('../models/Attendance');
const Subject = require('../models/Subject');

async function attendanceSummary(req, res) {
  try {
    const summary = await Attendance.aggregate([
      {
        $group: {
          _id: '$subject_id',
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ['$status', 'Late'] }, 1, 0] } },
        },
      },
      {
        $lookup: {
          from: 'subjects',
          localField: '_id',
          foreignField: '_id',
          as: 'subject',
        },
      },
      { $unwind: '$subject' },
      {
        $addFields: {
          percentage: {
            $round: [
              {
                $multiply: [
                  { $divide: [{ $add: ['$present', '$late'] }, '$total'] },
                  100,
                ],
              },
              1,
            ],
          },
        },
      },
      {
        $project: {
          _id: 0,
          id: { $toString: '$_id' },
          subject_id: '$_id',
          subject_name: '$subject.name',
          code: '$subject.code',
          total: 1,
          present: 1,
          absent: 1,
          late: 1,
          percentage: 1,
        },
      },
      { $sort: { subject_name: 1 } },
    ]);

    res.json(summary);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { attendanceSummary };
