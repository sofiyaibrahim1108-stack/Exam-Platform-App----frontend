import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleBasedRoute from './components/RoleBasedRoute';
import ExamLockGuard from './components/ExamLockGuard';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Layouts
import SuperAdminLayout from './layouts/SuperAdminLayout';
import AdminLayout from './layouts/AdminLayout';
import StaffLayout from './layouts/StaffLayout';
import StudentLayout from './layouts/StudentLayout';

// Dashboard Pages
import LandingPage from './pages/LandingPage';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import SuperAdminInstitutions from './pages/SuperAdminInstitutions';
import SuperAdminAdmins from './pages/SuperAdminAdmins';
import SuperAdminAuditLogs from './pages/SuperAdminAuditLogs';
import SuperAdminSettings from './pages/SuperAdminSettings';
import SuperAdminProfile from './pages/SuperAdminProfile';
import SuperAdminHelp from './pages/SuperAdminHelp';
import AdminDashboard from './pages/AdminDashboard';
import AdminDepartments from './pages/AdminDepartments';
import AdminCourses from './pages/AdminCourses';
import AdminSemesters from './pages/AdminSemesters';
import AdminSubjects from './pages/AdminSubjects';
import AdminUnits from './pages/AdminUnits';
import AdminTopics from './pages/AdminTopics';
import AdminStaff from './pages/AdminStaff';
import AdminStudents from './pages/AdminStudents';
import AdminFacultyAssignment from './pages/AdminFacultyAssignment';
import AdminPlaceholder from './pages/AdminPlaceholder';
import AdminPendingSubmissions from './pages/AdminPendingSubmissions';
import AdminQuestionBank from './pages/AdminQuestionBank';
import AdminRejectedSubmissions from './pages/AdminRejectedSubmissions';
import AdminExams from './pages/AdminExams';
import AdminResults from './pages/AdminResults';
import StaffResults from './pages/StaffResults';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminReports from './pages/AdminReports';
import AdminSettings from './pages/AdminSettings';
import AdminProfile from './pages/AdminProfile';
import AdminNotifications from './pages/AdminNotifications';
import AdminActivityLogs from './pages/AdminActivityLogs';
import AdminSupportTickets from './pages/AdminSupportTickets';








import StaffDashboard from './pages/StaffDashboard';
import StaffProfile from './pages/StaffProfile';
import StaffAssignedSubjects from './pages/StaffAssignedSubjects';
import StaffSyllabusAnalyzer from './pages/StaffSyllabusAnalyzer';
import StaffQuestionGenerator from './pages/StaffQuestionGenerator';
import StaffQuestionBank from './pages/StaffQuestionBank';
import StaffExams from './pages/StaffExams';
import StaffSupportTickets from './pages/StaffSupportTickets';
import StaffNotifications from './pages/StaffNotifications';
import StudentDashboard from './pages/StudentDashboard';
import StudentUpcoming from './pages/StudentUpcoming';
import StudentLive from './pages/StudentLive';
import StudentCompleted from './pages/StudentCompleted';
import StudentNotifications from './pages/StudentNotifications';
import StudentProfile from './pages/StudentProfile';
import StudentExamInterface from './pages/StudentExamInterface';

/**
 * Home path redirector based on authentication state and user role
 */
const HomeRedirect = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center gap-4">
        <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
        <p className="font-mono text-xs text-primary tracking-widest animate-pulse">INITIATING GATEWAY...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'Super Admin':
      return <Navigate to="/super-admin/dashboard" replace />;
    case 'Admin':
      return <Navigate to="/admin/dashboard" replace />;
    case 'Staff':
      return <Navigate to="/staff/dashboard" replace />;
    case 'Student':
      return <Navigate to="/student/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Protected Role-Based Routes */}
          <Route
            path="/super-admin"
            element={
              <ProtectedRoute>
                <RoleBasedRoute allowedRoles={['Super Admin']}>
                  <SuperAdminLayout />
                </RoleBasedRoute>
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<SuperAdminDashboard />} />
            <Route path="institutions" element={<SuperAdminInstitutions />} />
            <Route path="admins" element={<SuperAdminAdmins />} />
            <Route path="audit-logs" element={<SuperAdminAuditLogs />} />
            <Route path="settings" element={<SuperAdminSettings />} />
            <Route path="profile" element={<SuperAdminProfile />} />
            <Route path="help" element={<SuperAdminHelp />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <RoleBasedRoute allowedRoles={['Admin']}>
                  <AdminLayout />
                </RoleBasedRoute>
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="departments" element={<AdminDepartments />} />
            <Route path="courses" element={<AdminCourses />} />
            <Route path="semesters" element={<AdminSemesters />} />
            <Route path="subjects" element={<AdminSubjects />} />
            <Route path="units" element={<AdminUnits />} />
            <Route path="topics" element={<AdminTopics />} />
            <Route path="staff" element={<AdminStaff />} />
            <Route path="students" element={<AdminStudents />} />
            <Route path="faculty-assignment" element={<AdminFacultyAssignment />} />
            <Route path="question-bank" element={<AdminQuestionBank />} />
            <Route path="questions/pending" element={<AdminPendingSubmissions />} />
            <Route path="questions/approved" element={<AdminQuestionBank />} />
            <Route path="questions/rejected" element={<AdminRejectedSubmissions />} />
            <Route path="ai-center" element={<AdminPlaceholder />} />
            <Route path="exams" element={<AdminExams />} />
            <Route path="results" element={<AdminResults />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="activity-logs" element={<AdminActivityLogs />} />
            <Route path="support-tickets" element={<AdminSupportTickets />} />
            <Route path="ai-settings" element={<AdminPlaceholder />} />
            <Route path="approval-workflow" element={<Navigate to="/admin/questions/pending" replace />} />
            <Route path="profile" element={<AdminProfile />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          <Route
            path="/staff"
            element={
              <ProtectedRoute>
                <RoleBasedRoute allowedRoles={['Staff']}>
                  <StaffLayout />
                </RoleBasedRoute>
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<StaffDashboard />} />
            <Route path="profile" element={<StaffProfile />} />
            <Route path="assigned-subjects" element={<StaffAssignedSubjects />} />
            <Route path="syllabus/:subjectId" element={<StaffSyllabusAnalyzer />} />
            <Route path="questions" element={<StaffQuestionGenerator />} />
            <Route path="question-bank" element={<StaffQuestionBank />} />
            <Route path="exams" element={<StaffExams />} />
            <Route path="results" element={<StaffResults />} />
            <Route path="support-tickets" element={<StaffSupportTickets />} />
            <Route path="notifications" element={<StaffNotifications />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          {/* Student Routes Wrapped in Exam Lock Guard */}
          <Route element={<ExamLockGuard />}>
            <Route
              path="/student"
              element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['Student']}>
                    <StudentLayout />
                  </RoleBasedRoute>
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="upcoming" element={<StudentUpcoming />} />
              <Route path="live" element={<StudentLive />} />
              <Route path="completed" element={<StudentCompleted />} />
              <Route path="notifications" element={<StudentNotifications />} />
              <Route path="profile" element={<StudentProfile />} />
              <Route index element={<Navigate to="dashboard" replace />} />
            </Route>

            <Route
              path="/student/exam-session/:id"
              element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['Student']}>
                    <StudentExamInterface />
                  </RoleBasedRoute>
                </ProtectedRoute>
              }
            />
          </Route>


          {/* Redirect / to proper route */}
          <Route path="/" element={<LandingPage />} />

          {/* Fallback to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>

      {/* Global Notifications Handler */}
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'glass-panel text-on-surface font-sans text-sm',
          duration: 4000,
          style: {
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(107, 15, 26, 0.1)',
            boxShadow: '0 8px 16px rgba(107, 15, 26, 0.05)',
            color: '#191c1d',
          },
          success: {
            iconTheme: {
              primary: '#735c00', // Gold icon theme for branding
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ba1a1a', // Error red theme
              secondary: '#ffffff',
            },
          },
        }}
      />
    </AuthProvider>
  );
};

export default App;
