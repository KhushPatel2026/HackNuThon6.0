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
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  return (
    <div>
      <Logout/>
      <Routes>
        <Route path="/login" element={<Login/>} />
				<Route path="/profile" element={<Profile/>} />
        <Route path="/test" element={<Test/>} />
        <Route path="/" element={<TransactionForm/>} />
        <Route path="/admin" element={<AdminPanel/>} />
        <Route path="/audit-logs" element={<AuditLogs/>} />
        <Route path="*" element={<h1>404 Not Found</h1>} />
			</Routes>
    </div>
  )
}

export default App
