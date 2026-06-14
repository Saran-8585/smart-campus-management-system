const { getDB } = require('../db/database');

function attendanceSummary(req, res) {
  const db = getDB();
  const summary = db.prepare(`
    SELECT s.id, s.name AS subject_name, s.code,
           COUNT(a.id) AS total,
           SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) AS present,
           SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) AS absent,
           SUM(CASE WHEN a.status = 'Late' THEN 1 ELSE 0 END) AS late,
           ROUND(CAST(SUM(CASE WHEN a.status IN ('Present','Late') THEN 1 ELSE 0 END) AS REAL) / COUNT(a.id) * 100, 1) AS percentage
    FROM subjects s
    JOIN attendance a ON a.subject_id = s.id
    GROUP BY s.id
    ORDER BY s.name
  `).all();
  res.json(summary);
}

module.exports = { attendanceSummary };
