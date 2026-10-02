import { Routes, Route, Navigate } from "react-router-dom";
import PublicLayout from "../components/layout/PublicLayout";
import DashboardLayout from "../components/layout/DashboardLayout";
import AdminLayout from "../layouts/AdminLayout";
import ProtectedRoute from "../components/common/ProtectedRoute";
import AuthGate from "../components/common/AuthGate";

import Home from "../pages/Home";
import About from "../pages/About";
import Contact from "../pages/Contact";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";

import Practice from "../pages/practice/Practice";
import PracticeCategory from "../pages/practice/PracticeCategory";
import Speaking from "../pages/practice/Speaking";
import Writing from "../pages/practice/Writing";
import Reading from "../pages/practice/Reading";
import Listening from "../pages/practice/Listening";
import PracticeResult from "../pages/practice/PracticeResult";

import MockTests from "../pages/mocktest/MockTests";
import MockTestDetail from "../pages/mocktest/MockTestDetail";
import MockTestStart from "../pages/mocktest/MockTestStart";
import MockTestExam from "../pages/mocktest/MockTestExam";
import MockTestResult from "../pages/mocktest/MockTestResult";

import Dashboard from "../pages/student/Dashboard";
import MyProgress from "../pages/student/MyProgress";
import TestHistory from "../pages/student/TestHistory";
import SavedQuestions from "../pages/student/SavedQuestions";
import Profile from "../pages/student/Profile";
import Settings from "../pages/student/Settings";

import AdminDashboard from "../pages/admin/AdminDashboard";
import ManageStudents from "../pages/admin/ManageStudents";
import ManageQuestions from "../pages/admin/ManageQuestions";
import ManageMockTests from "../pages/admin/ManageMockTests";
import ManageResults from "../pages/admin/ManageResults";

function NotFound() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-6xl font-bold text-brand mb-2">404</h1>
      <p className="text-navy dark:text-white font-semibold mb-2">Page not found</p>
      <p className="text-slate-500 mb-6">The page you requested does not exist.</p>
      <a href="/" className="btn-primary">
        Go Home
      </a>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/practice" element={<Practice />} />
        <Route
          path="/practice/:skill/categories"
          element={
            <AuthGate title="Sign in to view practice categories">
              <PracticeCategory />
            </AuthGate>
          }
        />
        <Route
          path="/practice/speaking"
          element={
            <AuthGate title="Sign in to practice Speaking">
              <Speaking />
            </AuthGate>
          }
        />
        <Route
          path="/practice/writing"
          element={
            <AuthGate title="Sign in to practice Writing">
              <Writing />
            </AuthGate>
          }
        />
        <Route
          path="/practice/reading"
          element={
            <AuthGate title="Sign in to practice Reading">
              <Reading />
            </AuthGate>
          }
        />
        <Route
          path="/practice/listening"
          element={
            <AuthGate title="Sign in to practice Listening">
              <Listening />
            </AuthGate>
          }
        />
        <Route
          path="/practice/result"
          element={
            <AuthGate title="Sign in to view your results">
              <PracticeResult />
            </AuthGate>
          }
        />
        <Route path="/mock-tests" element={<MockTests />} />
        <Route path="/mock-tests/:id" element={<MockTestDetail />} />
        <Route
          path="/mock-tests/:id/start"
          element={
            <AuthGate title="Sign in to take this mock test">
              <MockTestStart />
            </AuthGate>
          }
        />
        <Route
          path="/mock-tests/:id/result"
          element={
            <AuthGate title="Sign in to view your test results">
              <MockTestResult />
            </AuthGate>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      {/* Exam interface without public chrome for focus */}
      <Route
        path="/mock-tests/:id/exam"
        element={
          <AuthGate title="Sign in to start the exam">
            <MockTestExam />
          </AuthGate>
        }
      />
      <Route path="/mock-tests/:id/start/exam" element={<Navigate to="../exam" replace />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute role="student">
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="progress" element={<MyProgress />} />
        <Route path="history" element={<TestHistory />} />
        <Route path="saved" element={<SavedQuestions />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="students" element={<ManageStudents />} />
        <Route path="questions" element={<ManageQuestions />} />
        <Route path="mock-tests" element={<ManageMockTests />} />
        <Route path="results" element={<ManageResults />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
