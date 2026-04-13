/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Messages from './pages/Messages';
import VideoCall from './pages/VideoCall';
import CVBuilder from './pages/CVBuilder';
import JobBoard from './pages/JobBoard';
import JobDetails from './pages/JobDetails';
import SavedJobs from './pages/SavedJobs';
import MyApplications from './pages/MyApplications';
import CoachProfile from './pages/CoachProfile';
import FindCoach from './pages/FindCoach';
import CoachReviews from './pages/CoachReviews';
import AdminDashboard from './pages/AdminDashboard';
import Notifications from './pages/Notifications';
import { PaymentStatus } from './pages/PaymentStatus';

import { Spinner } from './components/Spinner';

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner className="w-10 h-10" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/chat" 
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/messages" 
            element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/video-call" 
            element={
              <ProtectedRoute>
                <VideoCall />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/cv-builder" 
            element={
              <ProtectedRoute>
                <CVBuilder />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/jobs" 
            element={<JobBoard />} 
          />
          <Route 
            path="/jobs/:jobId" 
            element={
              <ProtectedRoute>
                <JobDetails />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/saved-jobs" 
            element={
              <ProtectedRoute>
                <SavedJobs />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/applications" 
            element={
              <ProtectedRoute>
                <MyApplications />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/coach-profile" 
            element={
              <ProtectedRoute>
                <CoachProfile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/coaches" 
            element={
              <ProtectedRoute>
                <FindCoach />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/coach/:coachId/reviews" 
            element={
              <ProtectedRoute>
                <CoachReviews />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/notifications" 
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            } 
          />
          <Route path="/payment-status" element={<PaymentStatus />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
