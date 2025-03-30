require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");
const cookieParser = require("cookie-parser");
const { OpenAI } = require("openai");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Server } = require("socket.io");
const http = require("http");
const jwt = require("jsonwebtoken");
const { Configuration, PlaidApi, PlaidEnvironments } = require("plaid");
const session = require("express-session");
const passport = require("./Utils/passportConfig");
const User = require("./Model/User");

// Import routes
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const socialAuthRoutes = require("./Routes/socialAuthRoute");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "http://localhost:5173", credentials: true } });

// Middleware setup
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Session configuration
app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Plaid Configuration
const plaidConfig = new Configuration({
  basePath: PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
      "PLAID-SECRET": process.env.PLAID_SECRET,
      "Plaid-Version": "2020-09-14",
    },
  },
});

const plaidClient = new PlaidApi(plaidConfig);

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI || process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Transaction Schema
const TransactionSchema = new mongoose.Schema({
  sender: { type: String, required: true },
  receiver: { type: String, required: true },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  remarks: String,
  ipAddress: String,
  deviceInfo: String,
  isFraudulent: { type: Boolean, default: false },
  fraudScore: Number,
  fraudReasons: String,
  complianceStatus: String,
  senderDetails: {
    name: String,
    accountNumber: String,
    routingNumber: String,
    ip: String,
  },
  plaidTransactionId: { type: String, unique: true }, // Store Plaid transaction ID
});

const Transaction = mongoose.model("Transaction", TransactionSchema);

// AI Clients
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const HF_API_TOKEN = process.env.HUGGINGFACE_API_KEY;

// Authentication Middleware
const authMiddleware = async (req, res, next) => {
  const token = req.headers["x-access-token"];
  if (!token) {
    console.log("No token provided in request headers");
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;
    const user = await User.findOne({ email }).select("-password");
    if (!user) {
      console.log(`User not found for email: ${email}`);
      return res.status(404).json({ error: "User not found" });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error("Token verification failed:", error.message);
    res.status(401).json({ error: "Invalid token" });
  }
};

// Retry Utility
async function withRetry(fn, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i < retries - 1) {
        console.warn(`Retry ${i + 1}/${retries} failed: ${error.message}`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}

// AI Agents (unchanged for brevity)
async function anomalyDetectionAgent(transaction) {
  const { amount, paymentMethod, ipAddress, deviceInfo, remarks, senderDetails } = transaction;
  const inputText = `Amount: ${amount}, Method: ${paymentMethod}, IP: ${ipAddress}, Device: ${deviceInfo}, Remarks: ${remarks}, Sender: ${JSON.stringify(senderDetails)}`;
  try {
    const response = await withRetry(() =>
      axios.post(
        "https://api-inference.huggingface.co/models/facebook/bart-large-mnli",
        { inputs: inputText, parameters: { candidate_labels: ["normal", "suspicious"] } },
        { headers: { Authorization: `Bearer ${HF_API_TOKEN}` } }
      )
    );
    return response.data.scores[response.data.labels.indexOf("suspicious")];
  } catch (error) {
    console.error("Anomaly Detection Error:", error);
    return 0.5;
  }
}

async function sequenceAnalysisAgent(transaction) {
  const pastTransactions = await Transaction.find({ sender: transaction.sender })
    .sort({ timestamp: -1 })
    .limit(10);
  const sequenceText = pastTransactions
    .map((t) => `Amount: ${t.amount}, Method: ${t.paymentMethod}, Fraud: ${t.isFraudulent}, Sender: ${JSON.stringify(t.senderDetails)}`)
    .concat(`Amount: ${transaction.amount}, Method: ${transaction.paymentMethod}, Sender: ${JSON.stringify(transaction.senderDetails)}`)
    .join("\n");
  try {
    const response = await withRetry(() =>
      axios.post(
        "https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english",
        { inputs: sequenceText },
        { headers: { Authorization: `Bearer ${HF_API_TOKEN}` } }
      )
    );
    return response.data[0].find((label) => label.label === "NEGATIVE")?.score || 0.5;
  } catch (error) {
    console.error("Sequence Analysis Error:", error);
    return 0.5;
  }
}

async function complianceAgent(transaction) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const compliancePrompt = `Check compliance with RBI regulations for this transaction: ${JSON.stringify(transaction)}. Provide a concise response indicating if it complies or violates regulations, and why.`;
  try {
    const result = await withRetry(() => model.generateContent(compliancePrompt));
    return result.response.text();
  } catch (error) {
    console.error("Compliance Check Error:", error);
    return "Unable to verify compliance due to an error.";
  }
}

async function insightAgent(transaction) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `You are a financial fraud expert. Analyze this transaction for fraud risks, considering sender details: ${JSON.stringify(transaction)}`;
    
    const response = await model.generateContent(prompt);
    const text = response.response.text();
    
    return text;
  } catch (error) {
    console.error("Insight Agent Error:", error);
    return "Unable to generate insights due to an error.";
  }
}

async function detectFraud(transaction) {
  try {
    const anomalyScore = await anomalyDetectionAgent(transaction);
    const sequenceScore = await sequenceAnalysisAgent(transaction);
    const complianceResult = await complianceAgent(transaction);
    const insights = await insightAgent(transaction);

    const finalScore = anomalyScore * 0.4 + sequenceScore * 0.6;
    const isFraudulent = finalScore > 0.7 || complianceResult.toLowerCase().includes("violate");
    const fraudReasons = isFraudulent
      ? `${insights}\nAnomaly Score: ${anomalyScore.toFixed(2)}\nSequence Score: ${sequenceScore.toFixed(2)}\nCompliance: ${complianceResult}`
      : "Transaction appears legitimate based on AI analysis.";

    return {
      isFraudulent,
      fraudScore: finalScore,
      fraudReasons,
      complianceStatus: complianceResult,
    };
  } catch (error) {
    console.error("Fraud Detection Error:", error);
    return {
      isFraudulent: false,
      fraudScore: 0.5,
      fraudReasons: "Fraud detection failed due to an error.",
      complianceStatus: "Unknown",
    };
  }
}

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api", profileRoutes);
app.use("/auth", socialAuthRoutes);

// API: Create Plaid Link Token for Sender
app.post("/api/plaid/create-link-token", authMiddleware, async (req, res) => {
  try {
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: req.user._id.toString() },
      client_name: "FraudGuard",
      products: ["auth", "identity", "transactions"], // Added "transactions" product
      country_codes: ["US"], // Adjust to "IN" for India if needed
      language: "en",
    });
    res.json({ link_token: response.data.link_token });
  } catch (error) {
    console.error("Plaid Link Token Error:", error);
    res.status(500).json({ error: "Failed to create Plaid Link token" });
  }
});

// API: Exchange Public Token and Save Sender Details
app.post("/api/plaid/exchange-token", authMiddleware, async (req, res) => {
  const { public_token, account_id } = req.body;
  try {
    const tokenResponse = await plaidClient.itemPublicTokenExchange({ public_token });
    const accessToken = tokenResponse.data.access_token;

    const authResponse = await plaidClient.authGet({ access_token: accessToken });
    const account = authResponse.data.accounts.find((acc) => acc.account_id === account_id);

    const identityResponse = await plaidClient.identityGet({ access_token: accessToken });
    const owner = identityResponse.data.accounts.find((acc) => acc.account_id === account_id)?.owners[0];

    const senderDetails = {
      name: owner?.names[0] || "Unknown",
      accountNumber: account?.account || "N/A",
      routingNumber: account?.routing || "N/A",
      ip: req.ip,
    };

    // Save access token and sender details to the user
    await User.updateOne(
      { _id: req.user._id },
      {
        plaidAccessToken: accessToken,
        senderDetails: senderDetails,
      }
    );

    res.json(senderDetails);
  } catch (error) {
    console.error("Plaid Token Exchange Error:", error);
    res.status(500).json({ error: "Failed to fetch sender details with Plaid" });
  }
});

// API: Get Sender Details (if already linked)
app.get("/api/plaid/sender-details", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.plaidAccessToken) {
      return res.status(400).json({ error: "No bank account linked yet" });
    }

    const authResponse = await plaidClient.authGet({ access_token: user.plaidAccessToken });
    const account = authResponse.data.accounts[0]; // Default to first account; adjust if needed
    const senderDetails = user.senderDetails || {
      name: "Unknown",
      accountNumber: account?.account || "N/A",
      routingNumber: account?.routing || "N/A",
      ip: req.ip,
    };

    res.json(senderDetails);
  } catch (error) {
    console.error("Fetch Sender Details Error:", error);
    res.status(500).json({ error: "Failed to fetch sender details" });
  }
});

// API: Add Transaction
app.post("/api/transaction", authMiddleware, async (req, res) => {
  const { receiver, amount, paymentMethod, remarks, ipAddress, deviceInfo } = req.body;
  const sender = req.user._id.toString();
  const senderDetails = req.user.senderDetails;

  if (!senderDetails || !senderDetails.accountNumber) {
    return res.status(400).json({ error: "Sender bank details are required. Please link your bank account." });
  }

  const transaction = {
    sender,
    receiver,
    amount: Number(amount),
    paymentMethod,
    remarks,
    ipAddress: ipAddress || req.ip,
    deviceInfo: deviceInfo || req.headers["user-agent"],
    senderDetails,
  };

  try {
    const fraudAnalysis = await detectFraud(transaction);
    const newTransaction = new Transaction({ ...transaction, ...fraudAnalysis });
    await newTransaction.save();
    io.emit("new_transaction", newTransaction);
    res.json(newTransaction);
  } catch (error) {
    console.error("Transaction Error:", error);
    res.status(500).json({ error: "Failed to process transaction" });
  }
});

// API: Get Transactions from Plaid and Sync with Database
app.get("/api/transactions", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.plaidAccessToken) {
      return res.status(400).json({ error: "No bank account linked yet" });
    }

    // Fetch transactions from Plaid (last 30 days as an example)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30); // Last 30 days

    const plaidResponse = await plaidClient.transactionsGet({
      access_token: user.plaidAccessToken,
      start_date: startDate.toISOString().split("T")[0],
      end_date: endDate.toISOString().split("T")[0],
    });

    const plaidTransactions = plaidResponse.data.transactions;

    // Map Plaid transactions to your schema
    const transactions = plaidTransactions.map(async (pt) => {
      const existingTransaction = await Transaction.findOne({ plaidTransactionId: pt.transaction_id });
      if (!existingTransaction) {
        const transaction = {
          sender: req.user._id.toString(),
          receiver: pt.merchant_name || "Unknown",
          amount: pt.amount,
          paymentMethod: pt.payment_channel || "CreditCard", // Adjust mapping as needed
          timestamp: new Date(pt.date),
          remarks: pt.name,
          ipAddress: req.ip,
          deviceInfo: req.headers["user-agent"],
          senderDetails: user.senderDetails,
          plaidTransactionId: pt.transaction_id,
        };

        const fraudAnalysis = await detectFraud(transaction);
        const newTransaction = new Transaction({ ...transaction, ...fraudAnalysis });
        await newTransaction.save();
        return newTransaction;
      }
      return existingTransaction;
    });

    const resolvedTransactions = await Promise.all(transactions);

    // Combine with any manually added transactions from MongoDB
    const dbTransactions = await Transaction.find({ sender: req.user._id.toString(), plaidTransactionId: { $exists: false } });
    const allTransactions = [...resolvedTransactions, ...dbTransactions].sort((a, b) => b.timestamp - a.timestamp);

    res.json(allTransactions);
  } catch (error) {
    console.error("Fetch Plaid Transactions Error:", error);
    res.status(500).json({ error: "Failed to fetch transactions from Plaid" });
  }
});

// WebSocket Connection
io.on("connection", (socket) => {
  console.log("🔗 New WebSocket Connection");
  socket.on("disconnect", () => console.log("❌ WebSocket Disconnected"));
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));