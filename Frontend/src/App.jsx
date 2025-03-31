import React from 'react'
import { useEffect } from 'react'
import { useNavigate,useLocation } from 'react-router-dom'
import { Routes, Route } from 'react-router-dom'
import './App.css'
import Login from './Pages/Authentication/Login/Login'
import Profile from './Pages/Profile/Profile'
import Logout from './Components/Logout'
import Test from './Pages/Testing/Test'
import TransactionForm from './Pages/Transaction/transactionForm'
import AdminPanel from './Pages/Transaction/adminPanel'
import AuditLogs from './Pages/Transaction/auditLogs'
import FraudDetectionLanding from './Pages/Landing/Landing'
import AdminDashboard from './Pages/Dashboard/AdminDashboard'
import UserDashboard from './Pages/Dashboard/UserDashboard'
import Sidebar from './Components/Sidebar'
import RegisterPage from './Pages/Authentication/Register/Register'


function App() {

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const token = urlParams.get('token');

  }, [location,navigate]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/register', { replace: true });
    }
  }, [navigate]);

  return (
    <div>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<RegisterPage/>} />

				<Route path="/profile" element={<Profile/>} />
        <Route path="/test" element={<Test/>} />
        <Route path="/" element={<TransactionForm/>} />
        <Route path="/admin" element={<AdminPanel/>} />
        <Route path="/audit-logs" element={<AuditLogs/>} />
        <Route path="*" element={<h1>404 Not Found</h1>} />
        <Route path="/landing" element={<FraudDetectionLanding />} />
        <Route path="/user-dashboard" element={<UserDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
			</Routes>
    </div>
  )
}

export default App
