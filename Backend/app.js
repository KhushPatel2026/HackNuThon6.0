require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const http = require('http');
const { GoogleGenerativeAI } = require('@google/generative-ai'); 
// Import Google Generative AI SDK
const User = require('./Model/User');

const authRoutes = require('./Routes/authRoutes');
const profileRoutes = require('./Routes/profileRoutes');
const socialAuthRoutes = require('./Routes/socialAuthRoute');

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: 'http://localhost:5173' } });

const MONGO_URL = process.env.MONGO_URI;
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
const HUGGING_FACE_API_KEY = process.env.HUGGING_FACE_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Initialize the Google Generative AI SDK with your API key
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
// Get the Gemini model
const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(session({ secret: JWT_SECRET, resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// MongoDB connection
mongoose.connect(MONGO_URL)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error("MongoDB error:", err));

// First, let's check if we need to drop the collection entirely to fix the index issue
mongoose.connection.once('open', async () => {
    try {
        console.log("Connection is open, checking for collection issues...");
        
        // Check if the transactions collection exists and drop it to recreate
        // This is a drastic approach but will solve the index issues
        const collections = await mongoose.connection.db.listCollections().toArray();
        const transactionCollectionExists = collections.some(
            collection => collection.name === 'transactions'
        );
        
        if (transactionCollectionExists) {
            console.log("Transactions collection exists, dropping it to resolve index issues...");
            await mongoose.connection.db.dropCollection('transactions');
            console.log("Transactions collection dropped successfully");
        }
    } catch (error) {
        console.error("Error handling collection:", error);
    }
});

// Transaction Schema - now with a completely new name to avoid conflicts
const transactionSchema = new mongoose.Schema({
    step: Number,
    type: String,
    amount: Number,
    nameOrig: String,
    oldbalanceOrg: Number,
    newbalanceOrig: Number,
    nameDest: String,
    oldbalanceDest: Number,
    newbalanceDest: Number,
    isFraud: Boolean,
    fraud_probability: Number,
    insight: String,
    compliance: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    created_at: { type: Date, default: Date.now },
    // Adding a unique transaction ID field to avoid collisions
    transactionId: { 
        type: String, 
        default: () => new mongoose.Types.ObjectId().toString(),
        unique: true
    }
});

// Create the models
const Transaction = mongoose.model('Transaction', transactionSchema);

// Audit Log Schema
const auditLogSchema = new mongoose.Schema({
    action: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now }
});
const AuditLog = mongoose.model('AuditLog', auditLogSchema);

// Authentication middleware
const authenticateUser = async (req, res, next) => {
    try {
        const token = req.headers['x-access-token'];
        if (!token) {
            console.log('Authentication error: No token provided');
            return res.status(401).json({ status: 'error', error: 'No authentication token provided' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token decoded:', decoded);
        
        const user = await User.findOne({ email: decoded.email }).select('-password');
        if (!user) {
            console.log('Authentication error: User not found for email:', decoded.email);
            return res.status(404).json({ status: 'error', error: 'User not found' });
        }
        
        req.user = user;
        next();
    } catch (error) {
        console.log('Authentication error:', error.message);
        return res.status(401).json({ status: 'error', error: 'Invalid or expired token' });
    }
};

// Add transaction
app.post('/api/transactions', authenticateUser, async (req, res) => {
    const transaction = req.body;
    try {
        console.log('Processing new transaction:', transaction);
        
        // Predict fraud
        console.log('Calling fraud prediction service...');
        const fraudResponse = await axios.post('http://localhost:8000/predict', transaction);
        const { isFraud, fraud_probability } = fraudResponse.data;
        console.log('Fraud prediction result:', { isFraud, fraud_probability });

        // Get insight from Hugging Face
        console.log('Getting insights from Hugging Face...');
        const insight = await getHuggingFaceInsight(transaction, isFraud);
        console.log('Insight received:', insight);

        // Check compliance with Gemini
        console.log('Checking compliance with Gemini...');
        const compliance = await checkComplianceWithGemini(transaction);
        console.log('Compliance check result:', compliance);

        // Convert string values to numbers
        const processedTransaction = {
            step: Number(transaction.step),
            type: transaction.type,
            amount: Number(transaction.amount),
            nameOrig: transaction.nameOrig,
            oldbalanceOrg: Number(transaction.oldbalanceOrg),
            newbalanceOrig: Number(transaction.newbalanceOrig),
            nameDest: transaction.nameDest,
            oldbalanceDest: Number(transaction.oldbalanceDest),
            newbalanceDest: Number(transaction.newbalanceDest),
            isFraud,
            fraud_probability,
            insight,
            compliance,
            userId: req.user._id
        };

        console.log('Creating transaction with processed data');
        
        const newTransaction = new Transaction(processedTransaction);
        const savedTransaction = await newTransaction.save();
        console.log('Transaction saved to database with ID:', savedTransaction._id);

        // Audit log
        try {
            const auditLog = new AuditLog({ 
                action: 'Transaction Added', 
                userId: req.user._id 
            });
            await auditLog.save();
            console.log('Audit log created for transaction');
        } catch (auditError) {
            console.error('Error creating audit log:', auditError);
            // Continue execution even if audit log fails
        }

        // Notify admins if fraudulent
        if (isFraud) {
            console.log('Emitting fraud alert to admins');
            io.emit('fraudAlert', savedTransaction);
        }

        res.json(savedTransaction);
    } catch (error) {
        console.error('Error processing transaction:', error);
        res.status(500).json({ status: 'error', error: error.message });
    }
});

// Fetch user transactions
app.get('/api/transactions', authenticateUser, async (req, res) => {
    try {
        console.log('Fetching transactions for user:', req.user._id);
        const transactions = await Transaction.find({ userId: req.user._id }).sort({ created_at: -1 });
        console.log(`Found ${transactions.length} transactions for user`);
        res.json(transactions);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ status: 'error', error: error.message });
    }
});

// Fetch all transactions (admin only)
app.get('/api/admin/transactions', authenticateUser, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            console.log('Unauthorized access attempt to admin transactions by user:', req.user._id);
            return res.status(403).json({ status: 'error', error: 'Admins only' });
        }
        
        console.log('Admin fetching all transactions');
        const transactions = await Transaction.find().sort({ created_at: -1 });
        console.log(`Found ${transactions.length} total transactions`);
        res.json(transactions);
    } catch (error) {
        console.error('Error fetching admin transactions:', error);
        res.status(500).json({ status: 'error', error: error.message });
    }
});

// Fetch audit logs (admin only)
app.get('/api/admin/audit-logs', authenticateUser, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            console.log('Unauthorized access attempt to audit logs by user:', req.user._id);
            return res.status(403).json({ status: 'error', error: 'Admins only' });
        }
        
        console.log('Admin fetching audit logs');
        const logs = await AuditLog.find().sort({ timestamp: -1 });
        console.log(`Found ${logs.length} audit logs`);
        res.json(logs);
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ status: 'error', error: error.message });
    }
});

// Hugging Face Insight
async function getHuggingFaceInsight(transaction, isFraud) {
    try {
        console.log('Calling Hugging Face API...');
        const response = await axios.post(
            'https://api-inference.huggingface.co/models/gpt2',
            { inputs: `Transaction: ${JSON.stringify(transaction)}. Fraud: ${isFraud}. Explain why.` },
            { headers: { Authorization: `Bearer ${HUGGING_FACE_API_KEY}` } }
        );
        return response.data[0].generated_text;
    } catch (error) {
        console.error('Error getting insight from Hugging Face:', error.message);
        return isFraud ? "Likely fraud due to unusual patterns." : "Appears legitimate based on data.";
    }
}

// Gemini Compliance Check using the Gemini SDK
async function checkComplianceWithGemini(transaction) {
    try {
        console.log('Preparing prompt for Gemini...');
        // Create a prompt for compliance checking
        const prompt = `
        Please analyze this financial transaction for compliance issues:
        
        Transaction Details:
        - Type: ${transaction.type}
        - Amount: $${transaction.amount}
        - Sender: ${transaction.nameOrig}
        - Recipient: ${transaction.nameDest}
        - Sender's old balance: $${transaction.oldbalanceOrg}
        - Sender's new balance: $${transaction.newbalanceOrig}
        - Recipient's old balance: $${transaction.oldbalanceDest}
        - Recipient's new balance: $${transaction.newbalanceDest}
        
        Evaluate this transaction for:
        1. AML (Anti-Money Laundering) compliance
        2. KYC (Know Your Customer) concerns
        3. Unusual activity patterns
        4. Regulatory reporting requirements
        
        Provide a brief compliance assessment (2-3 sentences).
        `;

        // Generate content using the Gemini model
        console.log('Sending request to Gemini...');
        const result = await geminiModel.generateContent(prompt);
        const response = await result.response;
        const complianceText = response.text();
        
        return complianceText || "Compliant with financial regulations";
    } catch (error) {
        console.error("Gemini API error:", error);
        return "Compliance check unavailable. Error connecting to Gemini.";
    }
}

app.use('/api/auth', authRoutes);
app.use('/api', profileRoutes);
app.use('/auth', socialAuthRoutes);

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));