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


const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const socialAuthRoutes = require('./routes/socialAuthRoute');

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

mongoose.connection.once('open', async () => {
    try {
        const collections = await mongoose.connection.db.listCollections().toArray();
        const transactionCollectionExists = collections.some(
            collection => collection.name === 'transactions'
        );

        if (transactionCollectionExists) {
            await mongoose.connection.db.dropCollection('transactions');
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
        const userTransactions = await Transaction.find({ userId: req.user._id }).sort({ created_at: -1 });

        const fraudResponse = await axios.post('http://localhost:8000/predict', transaction);
        const { isFraud, fraud_probability } = fraudResponse.data;

        let insight = await getHuggingFaceInsight(transaction, isFraud, userTransactions);
        insight = formatOutput(insight);

        let compliance = await checkComplianceWithGemini(transaction, userTransactions);
        compliance = formatOutput(compliance);

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

        const newTransaction = new Transaction(processedTransaction);
        const savedTransaction = await newTransaction.save();

        try {
            const auditLog = new AuditLog({
                action: 'Transaction Added',
                userId: req.user._id
            });
            await auditLog.save();
        } catch (auditError) {
            console.error('Error creating audit log:', auditError);
        }

        if (isFraud) {
            io.emit('fraudAlert', savedTransaction);
        }
        const token = req.headers['x-access-token'];
        if (!token) {
            console.log('Authentication error: No token provided');
            return res.status(401).json({ status: 'error', error: 'No authentication token provided' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const user = await User.findOne({ email: decoded.email }).select('-password');

        if (!user) {
            console.log('Authentication error: User not found for email:', decoded.email);
            return res.status(404).json({ status: 'error', error: 'User not found' });
        }

        user.accountBalance -= transaction.amount;
        await user.save();

        res.json({
            transaction: savedTransaction,
            fraudDetails: { isFraud, fraud_probability },
            insight,
            compliance
        });
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
});

// Fetch user transactions
app.get('/api/transactions', authenticateUser, async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.user._id }).sort({ created_at: -1 });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
});

// Fetch all transactions (admin only)
app.get('/api/admin/transactions', authenticateUser, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ status: 'error', error: 'Admins only' });
        }

        const transactions = await Transaction.find().sort({ created_at: -1 });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
});

// Fetch audit logs (admin only)
app.get('/api/admin/audit-logs', authenticateUser, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ status: 'error', error: 'Admins only' });
        }

        const logs = await AuditLog.find().sort({ timestamp: -1 });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
});

app.get("/api/user", authenticateUser, async (req, res) => {
    try {
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ status: "error", error: "Access denied" });
      }
      const users = await User.find({}, "-password");
  
      res.status(200).json({ status: "ok", users });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ status: "error", error: "Internal server error" });
    }
});

// Hugging Face Insight
async function getHuggingFaceInsight(transaction, isFraud, userTransactions) {
    try {
        const response = await axios.post(
            'https://api-inference.huggingface.co/models/google/gemma-3-27b-it',
            {
                inputs: `Analyze the following transaction and user's transaction history:
                Transaction: ${JSON.stringify(transaction)}.
                Fraud: ${isFraud}.
                User's Transaction History: ${JSON.stringify(userTransactions.slice(0, 10))}.
                Provide a concise explanation (2-3 lines) for why this transaction is fraudulent or not.`,
            },
            { headers: { Authorization: `Bearer ${HUGGING_FACE_API_KEY}` } }
        );

        if (response.data && Array.isArray(response.data) && response.data[0]?.generated_text) {
            return formatOutput(response.data[0].generated_text);
        } else {
            return "No insight available due to an unexpected response format.";
        }
    } catch (error) {
        if (error.response?.status === 429) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            return getHuggingFaceInsight(transaction, isFraud, userTransactions);
        }

        if (error.response?.status === 503) {
            return "Hugging Face service is currently unavailable. Please try again later.";
        }

        return isFraud
            ? "This transaction is likely fraudulent due to unusual patterns in the user's history."
            : "This transaction appears legitimate based on the user's transaction history.";
    }
}

// Gemini Compliance Check using the Gemini SDK
async function checkComplianceWithGemini(transaction, userTransactions) {
    try {
        const prompt = `
        Analyze this financial transaction for compliance issues and consider the user's transaction history:
        
        Transaction Details:
        - Type: ${transaction.type}
        - Amount: $${transaction.amount}
        - Sender: ${transaction.nameOrig}
        - Recipient: ${transaction.nameDest}
        - Sender's old balance: $${transaction.oldbalanceOrg}
        - Sender's new balance: $${transaction.newbalanceOrig}
        - Recipient's old balance: $${transaction.oldbalanceDest}
        - Recipient's new balance: $${transaction.newbalanceDest}
        
        User's Transaction History:
        ${JSON.stringify(userTransactions)}
        
        Provide a concise compliance assessment (2-3 lines) explaining whether this transaction is compliant or not.
        `;

        const result = await geminiModel.generateContent(prompt);
        const response = await result.response;
        return response.text() || "This transaction complies with financial regulations based on the user's history.";
    } catch (error) {
        return "Compliance check unavailable. Error connecting to Gemini.";
    }
}

// Utility function to format output
function formatOutput(output) {
    if (!output) return "No data available.";
    // Remove unwanted characters like asterisks, newlines, or excessive whitespace
    return output.replace(/[*\n\r]+/g, '').trim();
}

app.use('/api/auth', authRoutes);
app.use('/api', profileRoutes);
app.use('/auth', socialAuthRoutes);

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));