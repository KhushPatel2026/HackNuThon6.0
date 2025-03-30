import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

const socket = io('http://localhost:3000');

const TransactionForm = () => {
    const [transaction, setTransaction] = useState({
        step: '', type: '', amount: '', nameOrig: '', oldbalanceOrg: '',
        newbalanceOrig: '', nameDest: '', oldbalanceDest: '', newbalanceDest: ''
    });
    const [result, setResult] = useState(null);
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    useEffect(() => {
        if (!token) navigate('/login');
        socket.on('fraudAlert', (data) => alert(`Fraud Detected: ${data.amount}`));
        return () => socket.off('fraudAlert');
    }, [token, navigate]);

    const handleChange = (e) => setTransaction({ ...transaction, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:3000/api/transactions', transaction, {
                headers: { 'x-access-token': token }
            });
            setResult(response.data);
        } catch (error) {
            if (error.response?.status === 401) navigate('/login');
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: 'auto' }}>
            <h1>Submit Transaction</h1>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '10px' }}>
                <input name="step" placeholder="Step" type="number" onChange={handleChange} required style={inputStyle} />
                <select name="type" onChange={handleChange} required style={inputStyle}>
                    <option value="">Select Type</option>
                    <option value="CASH_IN">CASH_IN</option>
                    <option value="CASH_OUT">CASH_OUT</option>
                    <option value="DEBIT">DEBIT</option>
                    <option value="PAYMENT">PAYMENT</option>
                    <option value="TRANSFER">TRANSFER</option>
                </select>
                <input name="amount" placeholder="Amount" type="number" onChange={handleChange} required style={inputStyle} />
                <input name="nameOrig" placeholder="Name Orig" onChange={handleChange} required style={inputStyle} />
                <input name="oldbalanceOrg" placeholder="Old Balance Orig" type="number" onChange={handleChange} required style={inputStyle} />
                <input name="newbalanceOrig" placeholder="New Balance Orig" type="number" onChange={handleChange} required style={inputStyle} />
                <input name="nameDest" placeholder="Name Dest" onChange={handleChange} required style={inputStyle} />
                <input name="oldbalanceDest" placeholder="Old Balance Dest" type="number" onChange={handleChange} required style={inputStyle} />
                <input name="newbalanceDest" placeholder="New Balance Dest" type="number" onChange={handleChange} required style={inputStyle} />
                <button type="submit" style={buttonStyle}>Submit</button>
            </form>
            {result && (
                <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc' }}>
                    <h3>Result</h3>
                    <p><strong>Fraud:</strong> {result.isFraud ? 'Yes' : 'No'}</p>
                    <p><strong>Probability:</strong> {(result.fraud_probability * 100).toFixed(2)}%</p>
                    <p><strong>Insight:</strong> {result.insight}</p>
                    <p><strong>Compliance:</strong> {result.compliance}</p>
                </div>
            )}
            <div style={{ marginTop: '20px' }}>
                <a href="/admin" style={linkStyle}>Admin Panel</a> | <a href="/audit-logs" style={linkStyle}>Audit Logs</a>
            </div>
        </div>
    );
};

const inputStyle = { padding: '8px', fontSize: '16px' };
const buttonStyle = { padding: '10px', backgroundColor: '#28A745', color: 'white', border: 'none', cursor: 'pointer' };
const linkStyle = { color: '#007BFF', textDecoration: 'none' };

export default TransactionForm;