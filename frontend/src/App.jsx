import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'

// Layout
import Layout from './components/Layout'

// Pages
import Login from './pages/Login'

// Admin pages
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminSubjects from './pages/admin/Subjects'
import AdminNotices from './pages/admin/Notices'
import AdminTimetable from './pages/admin/Timetable'
import AdminReports from './pages/admin/Reports'
import AdminNavigationHistory from './pages/admin/NavigationHistory'
import AdminLostFoundPanel from './pages/admin/LostFoundPanel'

// Faculty pages
import FacultyDashboard from './pages/faculty/Dashboard'
import FacultyAttendance from './pages/faculty/Attendance'
import FacultyNotices from './pages/faculty/Notices'
import FacultyStudents from './pages/faculty/Students'

// Student pages
import StudentDashboard from './pages/student/Dashboard'
import StudentTimetable from './pages/student/Timetable'
import StudentAttendance from './pages/student/Attendance'
import StudentNotices from './pages/student/Notices'
import StudentProfile from './pages/student/Profile'

// Shared pages
import ClassroomStatus from './pages/ClassroomStatus'
import CampusNavigation from './pages/CampusNavigation'
import LostFound from './pages/LostFound'

function DashboardRedirect() {
  return <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute roles={['admin']}><Layout role="admin" /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="subjects" element={<AdminSubjects />} />
        <Route path="notices" element={<AdminNotices />} />
        <Route path="timetable" element={<AdminTimetable />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="classroom-status" element={<ClassroomStatus />} />
        <Route path="navigation-history" element={<AdminNavigationHistory />} />
        <Route path="lost-found" element={<AdminLostFoundPanel />} />
      </Route>

      {/* Faculty Routes */}
      <Route path="/faculty" element={<ProtectedRoute roles={['faculty']}><Layout role="faculty" /></ProtectedRoute>}>
        <Route index element={<FacultyDashboard />} />
        <Route path="attendance" element={<FacultyAttendance />} />
        <Route path="notices" element={<FacultyNotices />} />
        <Route path="students" element={<FacultyStudents />} />
        <Route path="classroom-status" element={<ClassroomStatus />} />
        <Route path="navigation" element={<CampusNavigation />} />
        <Route path="lost-found" element={<LostFound />} />
      </Route>

      {/* Student Routes */}
      <Route path="/student" element={<ProtectedRoute roles={['student']}><Layout role="student" /></ProtectedRoute>}>
        <Route index element={<StudentDashboard />} />
        <Route path="timetable" element={<StudentTimetable />} />
        <Route path="attendance" element={<StudentAttendance />} />
        <Route path="notices" element={<StudentNotices />} />
        <Route path="profile" element={<StudentProfile />} />
        <Route path="classroom-status" element={<ClassroomStatus />} />
        <Route path="navigation" element={<CampusNavigation />} />
        <Route path="lost-found" element={<LostFound />} />
      </Route>

      <Route path="/" element={<DashboardRedirect />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
