import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import Login from './Pages/Authentication/Login/Login';
import RegisterPage from './Pages/Authentication/Register/Register';
import Profile from './Pages/Profile/Profile';
import AdminPanel from './Pages/Transaction/adminPanel';
import AuditLogs from './Pages/Transaction/auditLogs';
import UserDashboard from './Pages/Dashboard/UserDashboard';
import AdminDashboard from './Pages/Dashboard/AdminDashboard';
import Logout from './Components/Logout';
import FraudDetectionLanding from './Pages/Landing/Landing';
import AdminUsersPage from './Pages/User/user';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');

    // Allow access to public routes like /login and /register
    if (!token && !['/login', '/register','/landing'].includes(location.pathname)) {
      navigate('/login', { replace: true });
    }
  }, [navigate, location]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('role');

    if (!token) {
      return;
    }

    if (location.pathname.includes('/admin') && userRole !== 'admin') {
      navigate('/user-dashboard', { replace: true });
      return;
    }

    setIsAuthorized(true);
  }, [navigate, location]);

  return (
    <div>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/landing" element={<FraudDetectionLanding />} />

        {/* Protected Routes */}
        {isAuthorized && (
          <>
            {/* User Routes */}
            <Route path="/user-dashboard" element={<UserDashboard />} />
            <Route path="/profile" element={<Profile />} />

            {/* Admin Routes */}
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
            <Route path="/users" element={<AdminUsersPage />} />

            {/* Logout */}
            <Route path="/logout" element={<Logout />} />
          </>
        )}

        {/* Fallback Route */}
        <Route path="*" element={<h1>404 Not Found</h1>} />
      </Routes>
    </div>
  );
}

export default App;
