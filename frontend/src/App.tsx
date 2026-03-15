import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Patient pages
import Dashboard from './pages/patient/Dashboard';
import Doctors from './pages/patient/Doctors';
import BookAppointment from './pages/patient/BookAppointment';
import Appointments from './pages/patient/Appointments';
import Records from './pages/patient/Records';
import Profile from './pages/patient/Profile';

// Doctor pages
import DoctorDashboard from './pages/doctor/Dashboard';
import Schedule from './pages/doctor/Schedule';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import Users from './pages/admin/Users';

import NotFound from './pages/NotFound';

const App = () => {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to={
          user?.role === 'doctor' ? '/doctor/dashboard' :
          user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'
        } />} />
        <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} />

        {/* Patient routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute roles={['patient']}>
            <Layout><Dashboard /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/doctors" element={
          <ProtectedRoute roles={['patient']}>
            <Layout><Doctors /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/book/:doctorId" element={
          <ProtectedRoute roles={['patient']}>
            <Layout><BookAppointment /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/appointments" element={
          <ProtectedRoute roles={['patient']}>
            <Layout><Appointments /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/records" element={
          <ProtectedRoute roles={['patient']}>
            <Layout><Records /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute roles={['patient']}>
            <Layout><Profile /></Layout>
          </ProtectedRoute>
        } />

        {/* Doctor routes */}
        <Route path="/doctor/dashboard" element={
          <ProtectedRoute roles={['doctor']}>
            <Layout><DoctorDashboard /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/doctor/appointments" element={
          <ProtectedRoute roles={['doctor']}>
            <Layout><Appointments /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/doctor/schedule" element={
          <ProtectedRoute roles={['doctor']}>
            <Layout><Schedule /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/doctor/profile" element={
          <ProtectedRoute roles={['doctor']}>
            <Layout><Profile /></Layout>
          </ProtectedRoute>
        } />

        {/* Admin routes */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute roles={['admin']}>
            <Layout><AdminDashboard /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute roles={['admin']}>
            <Layout><Users /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/appointments" element={
          <ProtectedRoute roles={['admin']}>
            <Layout><Appointments /></Layout>
          </ProtectedRoute>
        } />

        {/* Redirects */}
        <Route path="/" element={<Navigate to={isAuthenticated ? (
          user?.role === 'doctor' ? '/doctor/dashboard' :
          user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'
        ) : '/login'} />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
