import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // React Router for navigation
import axios from "axios";
import io from "socket.io-client";
import {
  ArrowRight,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  Plus,
  ChevronDown,
  Search,
  Eye,
  X,
} from "lucide-react";

// Initialize Socket.io client
const socket = io("http://localhost:3000");

// Transaction Form Component
const TransactionForm = ({ isOpen, onClose, onTransactionAdded }) => {
  const [formData, setFormData] = useState({
    step: "",
    type: "",
    amount: "",
    nameOrig: "",
    oldbalanceOrg: "",
    newbalanceOrig: "",
    nameDest: "",
    oldbalanceDest: "",
    newbalanceDest: "",
  });
  const [result, setResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) navigate("/login");
    socket.on("fraudAlert", (data) => alert(`Fraud Detected: ${data.amount}`));
    return () => socket.off("fraudAlert");
  }, [token, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await axios.post(
        "http://localhost:3000/api/transactions",
        formData,
        {
          headers: { "x-access-token": token },
        }
      );
      setResult(response.data);
      onTransactionAdded(response.data); // Notify parent to refresh transactions
    } catch (error) {
      if (error.response?.status === 401) navigate("/login");
      console.errorLTE("Error submitting transaction:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-tr from-[#1c1c1c] to-[#0a0a0a] rounded-xl border border-[#4aff78]/20 p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Submit Transaction</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#0a0a0a] border border-[#4aff78]/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Step</label>
            <input
              name="step"
              type="number"
              placeholder="Step"
              value={formData.step}
              onChange={handleChange}
              required
              className="w-full bg-[#0a0a0a] border border-[#4aff78]/10 rounded-md py-2 px-3 text-white text-sm focus:outline-none focus:border-[#4aff78]/30"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Transaction Type</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              className="w-full bg-[#0a0a0a] border border-[#4aff78]/10 rounded-md py-2 px-3 text-white text-sm focus:outline-none focus:border-[#4aff78]/30"
            >
              <option value="">Select Type</option>
              <option value="CASH_IN">CASH_IN</option>
              <option value="CASH_OUT">CASH_OUT</option>
              <option value="DEBIT">DEBIT</option>
              <option value="PAYMENT">PAYMENT</option>
              <option value="TRANSFER">TRANSFER</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Amount</label>
            <input
              name="amount"
              type="number"
              placeholder="Amount"
              value={formData.amount}
              onChange={handleChange}
              required
              className="w-full bg-[#0a0a0a] border border-[#4aff78]/10 rounded-md py-2 px-3 text-white text-sm focus:outline-none focus:border-[#4aff78]/30"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Origin Account</label>
              <input
                name="nameOrig"
                placeholder="Origin Account Name"
                value={formData.nameOrig}
                onChange={handleChange}
                required
                className="w-full bg-[#0a0a0a] border border-[#4aff78]/10 rounded-md py-2 px-3 text-white text-sm focus:outline-none focus:border-[#4aff78]/30"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Destination Account</label>
              <input
                name="nameDest"
                placeholder="Destination Account Name"
                value={formData.nameDest}
                onChange={handleChange}
                required
                className="w-full bg-[#0a0a0a] border border-[#4aff78]/10 rounded-md py-2 px-3 text-white text-sm focus:outline-none focus:border-[#4aff78]/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Origin Old Balance</label>
              <input
                name="oldbalanceOrg"
                type="number"
                placeholder="Origin Old Balance"
                value={formData.oldbalanceOrg}
                onChange={handleChange}
                required
                className="w-full bg-[#0a0a0a] border border-[#4aff78]/10 rounded-md py-2 px-3 text-white text-sm focus:outline-none focus:border-[#4aff78]/30"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Origin New Balance</label>
              <input
                name="newbalanceOrig"
                type="number"
                placeholder="Origin New Balance"
                value={formData.newbalanceOrig}
                onChange={handleChange}
                required
                className="w-full bg-[#0a0a0a] border border-[#4aff78]/10 rounded-md py-2 px-3 text-white text-sm focus:outline-none focus:border-[#4aff78]/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Destination Old Balance</label>
              <input
                name="oldbalanceDest"
                type="number"
                placeholder="Destination Old Balance"
                value={formData.oldbalanceDest}
                onChange={handleChange}
                required
                className="w-full bg-[#0a0a0a] border border-[#4aff78]/10 rounded-md py-2 px-3 text-white text-sm focus:outline-none focus:border-[#4aff78]/30"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Destination New Balance</label>
              <input
                name="newbalanceDest"
                type="number"
                placeholder="Destination New Balance"
                value={formData.newbalanceDest}
                onChange={handleChange}
                required
                className="w-full bg-[#0a0a0a] border border-[#4aff78]/10 rounded-md py-2 px-3 text-white text-sm focus:outline-none focus:border-[#4aff78]/30"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="group relative mt-2 px-4 py-3 bg-gradient-to-r from-[#4aff78] to-[#8aff8a] rounded-md text-black font-medium text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(74,255,120,0.5)] overflow-hidden disabled:opacity-70"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {isSubmitting ? "Processing..." : "Submit Transaction"}
            </span>
            <span className="absolute inset-0 bg-gradient-to-r from-[#8aff8a] to-[#4aff78] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
          </button>
        </form>

        {result && (
          <div className="mt-6 bg-[#0a0a0a] border border-[#4aff78]/10 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-3">Analysis Result</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Fraud Detection:</span>
                <span
                  className={result.isFraud ? "text-[#ff5555] font-medium" : "text-[#4aff78] font-medium"}
                >
                  {result.isFraud ? "Suspicious" : "Legitimate"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Fraud Probability:</span>
                <span className="font-medium">{(result.fraud_probability * 100).toFixed(2)}%</span>
              </div>
              <div className="pt-2 border-t border-[#4aff78]/10">
                <div className="text-sm text-gray-400 mb-1">Insight:</div>
                <div className="text-sm">{result.insight}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Compliance:</div>
                <div className="text-sm">{result.compliance}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Main Dashboard Component
export default function UserDashboard() {
  const [isVisible, setIsVisible] = useState(false);
  const [liveUpdates, setLiveUpdates] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Fetch transactions from the backend
  const fetchTransactions = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/transactions", {
        headers: { "x-access-token": token },
      });
      setTransactions(response.data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      if (error.response?.status === 401) navigate("/login");
    }
  };

  useEffect(() => {
    if (!token) navigate("/login");
    setIsVisible(true);
    fetchTransactions(); // Initial fetch

    if (liveUpdates) {
      const interval = setInterval(fetchTransactions, 15000); // Poll every 15 seconds
      return () => clearInterval(interval);
    }
  }, [liveUpdates, token, navigate]);

  // Handle new transaction addition
  const handleTransactionAdded = (newTransaction) => {
    setTransactions((prev) => [newTransaction, ...prev]);
  };

  // Map transaction status based on isFraud and other conditions
  const mapTransactionStatus = (transaction) => {
    if (transaction.isFraud) return "flagged";
    if (transaction.fraud_probability > 0.5) return "pending"; // Example condition
    return "approved";
  };

  // Filter transactions based on status
  const filteredTransactions = transactions.filter((transaction) => {
    const status = mapTransactionStatus(transaction);
    if (statusFilter === "all") return true;
    return status === statusFilter;
  });

  const counts = {
    total: transactions.length,
    flagged: transactions.filter((t) => mapTransactionStatus(t) === "flagged").length,
    pending: transactions.filter((t) => mapTransactionStatus(t) === "pending").length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f1a12] to-[#0a120a] text-white overflow-hidden relative">
      <div className="absolute -z-10 w-full h-full bg-[#4aff78]/5 mix-blend-overlay"></div>

      {/* Transaction Form Modal */}
      <TransactionForm
        isOpen={showTransactionForm}
        onClose={() => setShowTransactionForm(false)}
        onTransactionAdded={handleTransactionAdded}
      />

      {/* Navbar */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center border-b border-[#4aff78]/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#4aff78] rounded flex items-center justify-center">
            <Shield className="w-5 h-5 text-black" />
          </div>
          <span className="font-bold text-xl">SecureGuard</span>
        </div>
      </header>

      {/* Dashboard Header */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Transaction Dashboard</h1>
            <p className="text-gray-400">Monitor and manage your financial transactions</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="group relative px-4 py-2 bg-gradient-to-r from-[#4aff78] to-[#8aff8a] rounded-md text-black font-medium transition-all duration-300 hover:shadow-[0_0_20px_rgba(74,255,120,0.5)] overflow-hidden"
              onClick={() => setShowTransactionForm(true)}
            >
              <span className="relative z-10 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Transaction
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-[#8aff8a] to-[#4aff78] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            </button>

            <div className="flex items-center gap-2 bg-[#1c1c1c] rounded-md px-3 py-2 border border-[#4aff78]/10">
              <div
                className={`w-2 h-2 rounded-full ${liveUpdates ? "bg-[#4aff78] animate-pulse" : "bg-gray-500"}`}
              ></div>
              <span className="text-sm">Live Updates</span>
              <button
                className={`w-10 h-5 rounded-full relative ${liveUpdates ? "bg-[#4aff78]/30" : "bg-gray-700"} transition-colors duration-300`}
                onClick={() => setLiveUpdates(!liveUpdates)}
              >
                <span
                  className={`absolute top-0.5 ${liveUpdates ? "right-0.5" : "left-0.5"} w-4 h-4 rounded-full bg-white transition-all duration-300`}
                ></span>
              </button>
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            {
              title: "Total Transactions",
              value: counts.total,
              icon: <Activity className="w-5 h-5" />,
              suffix: "today",
              color: "from-[#4aff78]/10 to-[#8aff8a]/5",
            },
            {
              title: "Flagged Transactions",
              value: counts.flagged,
              icon: <AlertTriangle className="w-5 h-5" />,
              suffix: "for review",
              color: "from-[#ff5555]/10 to-[#ff8855]/5",
            },
            {
              title: "Pending Transactions",
              value: counts.pending,
              icon: <Clock className="w-5 h-5" />,
              suffix: "awaiting analysis",
              color: "from-[#ffaa55]/10 to-[#ffcc55]/5",
            },
          ].map((card, index) => (
            <div
              key={index}
              className={`bg-gradient-to-tr from-[#1c1c1c] to-[#0a0a0a] rounded-xl border border-[#4aff78]/10 p-6 transition-all duration-300 hover:shadow-[0_0_20px_rgba(74,255,120,0.1)] transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-gray-400 text-sm mb-1">{card.title}</div>
                  <div className="flex items-end gap-1">
                    <div className="text-3xl font-bold">{card.value}</div>
                    <div className="text-gray-400 text-sm mb-1">{card.suffix}</div>
                  </div>
                </div>
                <div
                  className={`w-10 h-10 rounded-lg bg-gradient-to-tr ${card.color} flex items-center justify-center`}
                >
                  {card.icon}
                </div>
              </div>
              <div className="mt-4 h-1 w-full bg-[#1c1c1c] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#4aff78] to-[#8aff8a] rounded-full"
                  style={{ width: `${(card.value / counts.total || 1) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* Transactions Section */}
        <div
          className={`bg-gradient-to-tr from-[#1c1c1c] to-[#0a0a0a] rounded-xl border border-[#4aff78]/10 p-6 transition-all duration-1000 delay-300 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 className="text-xl font-bold">Recent Transactions</h2>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:flex-auto">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Search transactions..."
                  className="w-full bg-[#0a0a0a] border border-[#4aff78]/10 rounded-md py-2 pl-10 pr-3 text-sm focus:outline-none focus:border-[#4aff78]/30"
                />
              </div>

              <div className="relative">
                <button
                  className="flex items-center gap-2 bg-[#0a0a0a] border border-[#4aff78]/10 rounded-md py-2 px-3 text-sm"
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                >
                  <Filter className="w-4 h-4" />
                  <span>
                    {statusFilter === "all"
                      ? "All Transactions"
                      : statusFilter === "approved"
                      ? "Approved"
                      : statusFilter === "flagged"
                      ? "Flagged"
                      : "Pending"}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {showFilterMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-[#1c1c1c] border border-[#4aff78]/10 rounded-md shadow-lg z-10">
                    <div className="py-1">
                      {["all", "approved", "flagged", "pending"].map((status) => (
                        <button
                          key={status}
                          className="block w-full text-left px-4 py-2 text-sm hover:bg-[#4aff78]/10 transition-colors"
                          onClick={() => {
                            setStatusFilter(status);
                            setShowFilterMenu(false);
                          }}
                        >
                          {status === "all"
                            ? "All Transactions"
                            : status === "approved"
                            ? "Approved"
                            : status === "flagged"
                            ? "Flagged"
                            : "Pending"}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-[#4aff78]/10">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Transaction ID</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Description</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Amount</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Date/Time</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Status</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium text-sm">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction, index) => (
                  <tr
                    key={transaction.transactionId}
                    className={`border-b border-[#4aff78]/5 hover:bg-[#4aff78]/5 transition-colors ${index === 0 ? "animate-pulse bg-[#4aff78]/5" : ""}`}
                  >
                    <td className="py-4 px-4">{transaction.transactionId.slice(0, 8)}</td>
                    <td className="py-4 px-4">{transaction.type}</td>
                    <td className="py-4 px-4 font-medium">₹{transaction.amount.toLocaleString()}</td>
                    <td className="py-4 px-4 text-gray-400">
                      {new Date(transaction.created_at).toLocaleString()}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            mapTransactionStatus(transaction) === "approved"
                              ? "bg-[#4aff78]"
                              : mapTransactionStatus(transaction) === "flagged"
                              ? "bg-[#ff5555]"
                              : "bg-[#ffaa55]"
                          }`}
                        ></div>
                        <span
                          className={
                            mapTransactionStatus(transaction) === "approved"
                              ? "text-[#4aff78]"
                              : mapTransactionStatus(transaction) === "flagged"
                              ? "text-[#ff5555]"
                              : "text-[#ffaa55]"
                          }
                        >
                          {mapTransactionStatus(transaction).charAt(0).toUpperCase() +
                            mapTransactionStatus(transaction).slice(1)}
                        </span>
                      </div>
                      {transaction.isFraud && (
                        <div className="text-xs text-gray-400 mt-1 ml-4">Fraud Detected</div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button className="text-[#4aff78] hover:text-[#8aff8a] transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-between items-center">
            <div className="text-sm text-gray-400">
              Showing {filteredTransactions.length} of {transactions.length} transactions
            </div>
            <button className="flex items-center gap-1 text-[#4aff78] hover:text-[#8aff8a] transition-colors text-sm">
              View All Transactions <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* AI Insights */}
        <div
          className={`mt-8 bg-gradient-to-tr from-[#1c1c1c] to-[#0a0a0a] rounded-xl border border-[#4aff78]/10 p-6 transition-all duration-1000 delay-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
        >
          <h2 className="text-xl font-bold mb-4">AI-Driven Insights</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#4aff78]/10 flex items-center justify-center text-[#4aff78] shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <div className="font-medium">Unusual Pattern Detected</div>
                <div className="text-sm text-gray-400">
                  {counts.flagged} transactions flagged due to unusual patterns
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#4aff78]/10 flex items-center justify-center text-[#4aff78] shrink-0">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <div className="font-medium">Transaction Volume</div>
                <div className="text-sm text-gray-400">
                  Total of {transactions.length} transactions recorded
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#4aff78]/10 flex items-center justify-center text-[#4aff78] shrink-0">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div>
                <div className="font-medium">Compliance Check</div>
                <div className="text-sm text-gray-400">
                  {counts.total - counts.flagged} transactions compliant with regulations
                </div>
              </div>
            </div>
          </div>
          <button className="mt-4 flex items-center gap-1 text-[#4aff78] hover:text-[#8aff8a] transition-colors text-sm">
            View Detailed Analysis <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-6 border-t border-[#4aff78]/10 mt-12">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <div className="w-6 h-6 bg-[#4aff78] rounded flex items-center justify-center">
              <Shield className="w-4 h-4 text-black" />
            </div>
            <span className="font-medium text-sm">SecureGuard</span>
          </div>
          <div className="text-xs text-gray-400">
            © {new Date().getFullYear()} SecureGuard. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}