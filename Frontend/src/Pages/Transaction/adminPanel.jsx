import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminPanel = () => {
    const [transactions, setTransactions] = useState([]);
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const response = await axios.get('http://localhost:3000/api/admin/transactions', {
                    headers: { 'x-access-token': token }
                });
                setTransactions(response.data);
            } catch (error) {
                if (error.response?.status === 401 || error.response?.status === 403) navigate('/login');
            }
        };
        fetchTransactions();
    }, [token, navigate]);

    return (
        <div>
            <h1>Admin Panel - All Transactions</h1>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f2f2f2' }}>
                        <th style={thStyle}>ID</th>
                        <th style={thStyle}>Type</th>
                        <th style={thStyle}>Amount</th>
                        <th style={thStyle}>Fraud</th>
                        <th style={thStyle}>Probability</th>
                        <th style={thStyle}>Insight</th>
                        <th style={thStyle}>Compliance</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.map(tx => (
                        <tr key={tx._id} style={{ backgroundColor: tx.isFraud ? '#ffcccc' : 'white' }}>
                            <td style={tdStyle}>{tx._id}</td>
                            <td style={tdStyle}>{tx.type}</td>
                            <td style={tdStyle}>{tx.amount}</td>
                            <td style={tdStyle}>{tx.isFraud ? 'Yes' : 'No'}</td>
                            <td style={tdStyle}>{(tx.fraud_probability * 100).toFixed(2)}%</td>
                            <td style={tdStyle}>{tx.insight}</td>
                            <td style={tdStyle}>{tx.compliance}</td>
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

export default AdminPanel;