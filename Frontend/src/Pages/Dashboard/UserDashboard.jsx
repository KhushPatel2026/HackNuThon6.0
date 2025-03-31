import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import {
  ArrowRight,
  Shield,
  Activity,
  AlertTriangle,
  Clock,
  Filter,
  Plus,
  ChevronDown,
  Search,
  Eye,
  X,
  LogOut,
  Home,
  User,
} from "lucide-react";

// Initialize Socket.io client
const socket = io("http://localhost:3000");

// Transaction Form Component
const TransactionForm = ({ isOpen, onClose, onTransactionAdded }) => {
  const [formData, setFormData] = useState({
    step: "1", // Default step to 1
    type: "",
    amount: "",
    nameOrig: "",
    oldbalanceOrg: "",
    newbalanceOrig: "",
    nameDest: "",
    oldbalanceDest: "",
    newbalanceDest: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) navigate("/login");

    const fetchUserDetails = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3000/api/profile/user-details",
          {
            headers: { "x-access-token": token },
          }
        );
        const { name, accountBalance } = response.data.user;
        setFormData((prev) => ({
          ...prev,
          nameOrig: name || "Unknown User", // Fallback if name is missing
          oldbalanceOrg: accountBalance !== undefined ? accountBalance.toString() : "0",
          newbalanceOrig: accountBalance !== undefined ? accountBalance.toString() : "0", // Initial value matches oldbalanceOrg
        }));
      } catch (error) {
        console.error("Error fetching user details:", error);
        if (error.response?.status === 401) navigate("/login");
        setErrorMessage("Failed to load user details.");
      }
    };

    if (isOpen) fetchUserDetails();
  }, [isOpen, token, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAmountChange = (e) => {
    const amount = parseFloat(e.target.value) || 0;
    const oldBalance = parseFloat(formData.oldbalanceOrg) || 0;
    setFormData((prev) => ({
      ...prev,
      amount: amount.toString(),
      newbalanceOrig: (oldBalance - amount).toString(),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    const payload = {
      step: parseInt(formData.step) || 1, // Default to 1 if invalid
      type: formData.type,
      amount: parseFloat(formData.amount) || 0,
      nameOrig: formData.nameOrig,
      oldbalanceOrg: parseFloat(formData.oldbalanceOrg) || 0,
      newbalanceOrig: parseFloat(formData.newbalanceOrig) || 0,
      nameDest: formData.nameDest,
      oldbalanceDest: parseFloat(formData.oldbalanceDest) || 0,
      newbalanceDest: parseFloat(formData.newbalanceDest) || 0,
    };

    try {
      const response = await axios.post(
        "http://localhost:3000/api/transactions",
        payload,
        {
          headers: { "x-access-token": token },
        }
      );
      onTransactionAdded(response.data);
      onClose();
    } catch (error) {
      console.error("Error submitting transaction:", error);
      if (error.response?.status === 401) navigate("/login");
      setErrorMessage(
        error.response?.data?.error || "Failed to submit transaction."
      );
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
        {errorMessage && (
          <div className="mb-4 p-2 bg-[#ff5555]/20 text-[#ff5555] rounded-md text-sm">
            {errorMessage}
          </div>
        )}
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
            <label className="block text-sm text-gray-400 mb-1">
              Transaction Type
            </label>
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
              onChange={handleAmountChange}
              required
              className="w-full bg-[#0a0a0a] border border-[#4aff78]/10 rounded-md py-2 px-3 text-white text-sm focus:outline-none focus:border-[#4aff78]/30"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Origin Account
              </label>
              <input
                name="nameOrig"
                value={formData.nameOrig}
                disabled // Disabled to prevent changes
                className="w-full bg-[#0a0a0a] border border-[#4aff78]/10 rounded-md py-2 px-3 text-white text-sm focus:outline-none focus:border-[#4aff78]/30 opacity-70 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Destination Account
              </label>
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
              <label className="block text-sm text-gray-400 mb-1">
                Origin Old Balance
              </label>
              <input
                name="oldbalanceOrg"
                value={formData.oldbalanceOrg}
                disabled // Disabled to prevent changes
                className="w-full bg-[#0a0a0a] border border-[#4aff78]/10 rounded-md py-2 px-3 text-white text-sm focus:outline-none focus:border-[#4aff78]/30 opacity-70 cursor-not-allowed"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Destination Old Balance
              </label>
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
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
              <label className="block text-sm text-gray-400 mb-1">
                Origin New Balance
              </label>
              <input
                name="newbalanceOrig"
                value={formData.newbalanceOrig}
                disabled // Disabled since it's calculated
                className="w-full bg-[#0a0a0a] border border-[#4aff78]/10 rounded-md py-2 px-3 text-white text-sm focus:outline-none focus:border-[#4aff78]/30 opacity-70 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Destination New Balance
              </label>
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
      </div>
    </div>
  );
};

// Main Dashboard Component (unchanged)
export default function UserDashboard() {
  const [isVisible, setIsVisible] = useState(false);
  const [liveUpdates, setLiveUpdates] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [activePage, setActivePage] = useState("dashboard");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const fetchTransactions = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3000/api/transactions",
        {
          headers: { "x-access-token": token },
        }
      );
      setTransactions(response.data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      if (error.response?.status === 401) navigate("/login");
    }
  };

  useEffect(() => {
    if (!token) navigate("/login");
    setIsVisible(true);
    fetchTransactions();

    if (liveUpdates) {
      const interval = setInterval(fetchTransactions, 15000);
      return () => clearInterval(interval);
    }
  }, [liveUpdates, token, navigate]);

  const handleTransactionAdded = (data) => {
    setTransactions((prev) => [data.transaction, ...prev]);
  };

  const handleNavigate = (page) => {
    if (page === "logout") {
      localStorage.removeItem("token");
      navigate("/login");
    } else {
      setActivePage(page);
    }
  };

  return (
    <div className="flex">
      <div className="fixed top-0 left-0 h-screen w-64 bg-[#0a0a0a] border-r border-[#4aff78]/10">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-[#4aff78] rounded flex items-center justify-center">
              <Shield className="w-5 h-5 text-black" />
            </div>
            <span className="font-bold text-xl text-white">SecureGuard</span>
          </div>
          <nav className="space-y-4">
            <button
              onClick={() => handleNavigate("dashboard")}
              className={`flex items-center gap-2 w-full text-left px-4 py-2 rounded-md ${
                activePage === "dashboard"
                  ? "bg-[#4aff78]/10 text-[#4aff78]"
                  : "text-gray-400 hover:bg-[#4aff78]/5 hover:text-white"
              }`}
            >
              <Home className="w-5 h-5" />
              Dashboard
            </button>
            <button
              onClick={() => handleNavigate("profile")}
              className={`flex items-center gap-2 w-full text-left px-4 py-2 rounded-md ${
                activePage === "profile"
                  ? "bg-[#4aff78]/10 text-[#4aff78]"
                  : "text-gray-400 hover:bg-[#4aff78]/5 hover:text-white"
              }`}
            >
              <User className="w-5 h-5" />
              Profile
            </button>
            <button
              onClick={() => handleNavigate("logout")}
              className="flex items-center gap-2 w-full text-left px-4 py-2 rounded-md text-gray-400 hover:bg-[#4aff78]/5 hover:text-white"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </nav>
        </div>
      </div>

      <div className="flex-1 ml-64 min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f1a12] to-[#0a120a] text-white overflow-hidden relative">
        <div className="absolute -z-10 w-full h-full bg-[#4aff78]/5 mix-blend-overlay"></div>

        <TransactionForm
          isOpen={showTransactionForm}
          onClose={() => setShowTransactionForm(false)}
          onTransactionAdded={handleTransactionAdded}
        />

        <header className="container mx-auto px-4 py-6 flex justify-between items-center border-b border-[#4aff78]/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#4aff78] rounded flex items-center justify-center">
              <Shield className="w-5 h-5 text-black" />
            </div>
            <span className="font-bold text-xl">SecureGuard</span>
          </div>
        </header>

        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                Transaction Dashboard
              </h1>
              <p className="text-gray-400">
                Monitor and manage your financial transactions
              </p>
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
                  className={`w-2 h-2 rounded-full ${
                    liveUpdates ? "bg-[#4aff78] animate-pulse" : "bg-gray-500"
                  }`}
                ></div>
                <span className="text-sm">Live Updates</span>
                <button
                  className={`w-10 h-5 rounded-full relative ${
                    liveUpdates ? "bg-[#4aff78]/30" : "bg-gray-700"
                  } transition-colors duration-300`}
                  onClick={() => setLiveUpdates(!liveUpdates)}
                >
                  <span
                    className={`absolute top-0.5 ${
                      liveUpdates ? "right-0.5" : "left-0.5"
                    } w-4 h-4 rounded-full bg-white transition-all duration-300`}
                  ></span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[
              {
                title: "Total Transactions",
                value: transactions.length,
                icon: <Activity className="w-5 h-5" />,
                suffix: "today",
                color: "from-[#4aff78]/10 to-[#8aff8a]/5",
              },
              {
                title: "Flagged Transactions",
                value: transactions.filter((t) => t.isFraud).length,
                icon: <AlertTriangle className="w-5 h-5" />,
                suffix: "for review",
                color: "from-[#ff5555]/10 to-[#ff8855]/5",
              },
            ].map((card, index) => (
              <div
                key={index}
                className={`bg-gradient-to-tr from-[#1c1c1c] to-[#0a0a0a] rounded-xl border border-[#4aff78]/10 p-6 transition-all duration-300 hover:shadow-[0_0_20px_rgba(74,255,120,0.1)] transition-all duration-1000 ${
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-12"
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-gray-400 text-sm mb-1">
                      {card.title}
                    </div>
                    <div className="flex items-end gap-1">
                      <div className="text-3xl font-bold">{card.value}</div>
                      <div className="text-gray-400 text-sm mb-1">
                        {card.suffix}
                      </div>
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
                    style={{
                      width: `${
                        (card.value / transactions.length || 1) * 100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div
            className={`bg-gradient-to-tr from-[#1c1c1c] to-[#0a0a0a] rounded-xl border border-[#4aff78]/10 p-6 transition-all duration-1000 delay-300 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-12"
            }`}
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
                    <span>Filter</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {showFilterMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-[#1c1c1c] border border-[#4aff78]/10 rounded-md shadow-lg z-10">
                      <div className="py-1">
                        {["all", "flagged", "pending"].map((status) => (
                          <button
                            key={status}
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-[#4aff78]/10 transition-colors"
                            onClick={() => {
                              setStatusFilter(status);
                              setShowFilterMenu(false);
                            }}
                          >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
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
                    <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">
                      Transaction ID
                    </th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">
                      Description
                    </th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">
                      Amount
                    </th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">
                      Date/Time
                    </th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">
                      Fraud
                    </th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium text-sm">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction, index) => (
                    <tr
                      key={transaction.transactionId}
                      className={`border-b border-[#4aff78]/5 hover:bg-[#4aff78]/5 transition-colors ${
                        index === 0 ? "animate-pulse bg-[#4aff78]/5" : ""
                      }`}
                    >
                      <td className="py-4 px-4">
                        {transaction.transactionId.slice(0, 8)}
                      </td>
                      <td className="py-4 px-4">{transaction.type}</td>
                      <td className="py-4 px-4 font-medium">
                        ${transaction.amount.toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-gray-400">
                        {new Date(transaction.created_at).toLocaleString()}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={
                            transaction.isFraud
                              ? "text-[#ff5555]"
                              : "text-[#4aff78]"
                          }
                        >
                          {transaction.isFraud ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          className="text-[#4aff78] hover:text-[#8aff8a] transition-colors"
                          onClick={() => setSelectedTransaction(transaction)}
                        >
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
                Showing {transactions.length} transactions
              </div>
              <button className="flex items-center gap-1 text-[#4aff78] hover:text-[#8aff8a] transition-colors text-sm">
                View All Transactions <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {selectedTransaction && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-gradient-to-tr from-[#1c1c1c] to-[#0a0a0a] rounded-xl border border-[#4aff78]/20 p-6 w-full max-w-xl">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-white">
                    Transaction Details
                  </h2>
                  <button
                    onClick={() => setSelectedTransaction(null)}
                    className="w-8 h-8 rounded-full bg-[#0a0a0a] border border-[#4aff78]/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="text-gray-400">Transaction ID:</span>
                    <span className="ml-2 text-white">
                      {selectedTransaction.transactionId}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Type:</span>
                    <span className="ml-2 text-white">
                      {selectedTransaction.type}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Amount:</span>
                    <span className="ml-2 text-white">
                      ${selectedTransaction.amount.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Date/Time:</span>
                    <span className="ml-2 text-white">
                      {new Date(selectedTransaction.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Fraud:</span>
                    <span
                      className={`ml-2 ${
                        selectedTransaction.isFraud
                          ? "text-[#ff5555]"
                          : "text-[#4aff78]"
                      }`}
                    >
                      {selectedTransaction.isFraud ? "Yes" : "No"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Fraud Probability:</span>
                    <span className="ml-2 text-white">
                      {(selectedTransaction.fraud_probability * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Insight:</span>
                    <p className="mt-1 text-white">
                      {selectedTransaction.insight}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">Compliance:</span>
                    <p className="mt-1 text-white">
                      {selectedTransaction.compliance}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

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
    </div>
  );
}