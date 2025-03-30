import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await axios.get('http://localhost:3000/api/admin/audit-logs', {
                    headers: { 'x-access-token': token }
                });
                setLogs(response.data);
            } catch (error) {
                if (error.response?.status === 401 || error.response?.status === 403) navigate('/login');
            }
        };
        fetchLogs();
    }, [token, navigate]);

    return (
        <div>
            <h1>Audit Logs</h1>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f2f2f2' }}>
                        <th style={thStyle}>Action</th>
                        <th style={thStyle}>User ID</th>
                        <th style={thStyle}>Timestamp</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.map(log => (
                        <tr key={log._id}>
                            <td style={tdStyle}>{log.action}</td>
                            <td style={tdStyle}>{log.userId}</td>
                            <td style={tdStyle}>{new Date(log.timestamp).toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <a href="/" style={{ display: 'block', marginTop: '20px', ...linkStyle }}>Back to Transaction Form</a>
        </div>
    );
};

const thStyle = { padding: '10px', border: '1px solid #ddd' };
const tdStyle = { padding: '10px', border: '1px solid #ddd' };
const linkStyle = { color: '#007BFF', textDecoration: 'none' };

export default AuditLogs;