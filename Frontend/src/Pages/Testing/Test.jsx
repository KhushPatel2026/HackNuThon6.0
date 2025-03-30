import { useEffect, useState } from "react";
import io from "socket.io-client";
import axios from "axios";
import { usePlaidLink } from "react-plaid-link";

const socket = io("http://localhost:3000", {
  transports: ["websocket"],
  reconnection: true,
  cors: { origin: "http://localhost:5173" },
});

export default function Test() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [formData, setFormData] = useState({
    sender: "",
    receiver: "",
    amount: "",
    paymentMethod: "UPI",
    remarks: "",
    ipAddress: "",
    deviceInfo: navigator.userAgent,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [senderDetails, setSenderDetails] = useState(null);
  const [linkToken, setLinkToken] = useState(null);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      setError("Please log in to continue");
      return;
    }
    try {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      setFormData((prev) => ({ ...prev, sender: decoded.id }));
      setIsAdmin(decoded.role === "admin");
    } catch (error) {
      setError("Invalid authentication token");
      console.error("JWT Decode Error:", error);
    }
    fetchTransactions();
    fetchSenderDetails();
    fetchLinkToken();

    socket.on("connect_error", (err) => setError("Connection error: " + err.message));
    socket.on("new_transaction", (transaction) => {
      setTransactions((prev) => [transaction, ...prev]);
    });

    return () => {
      socket.off("new_transaction");
      socket.off("connect_error");
    };
  }, [token]);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const { data } = await axios.get("http://localhost:3000/api/transactions", {
        headers: { "x-access-token": token },
      });
      setTransactions(data);
    } catch (error) {
      setError("Failed to load transactions: " + (error.response?.data?.error || error.message));
      console.error("Fetch Transactions Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLinkToken = async () => {
    try {
      const { data } = await axios.post(
        "http://localhost:3000/api/plaid/create-link-token",
        {},
        { headers: { "x-access-token": token } }
      );
      setLinkToken(data.link_token);
    } catch (error) {
      setError("Failed to initialize bank linking: " + (error.response?.data?.error || error.message));
    }
  };

  const fetchSenderDetails = async () => {
    try {
      const { data } = await axios.get("http://localhost:3000/api/plaid/sender-details", {
        headers: { "x-access-token": token },
      });
      setSenderDetails(data);
    } catch (error) {
      setSenderDetails(null); // No sender details yet; will prompt linking
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onPlaidSuccess = async (publicToken, metadata) => {
    try {
      const { data } = await axios.post(
        "http://localhost:3000/api/plaid/exchange-token",
        { public_token: publicToken, account_id: metadata.account_id },
        { headers: { "x-access-token": token } }
      );
      setSenderDetails(data);
      setSuccess("Your bank account linked successfully!");
      fetchTransactions(); // Fetch transactions after linking
    } catch (error) {
      setSenderDetails({ error: error.response?.data?.error || "Failed to connect bank account" });
      setError(error.response?.data?.error || "Plaid integration failed");
    }
  };

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: onPlaidSuccess,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!senderDetails || senderDetails.error || !formData.amount || !formData.receiver) {
      setError("Please complete all fields and link your bank account");
      return;
    }
    setError(null);
    try {
      const { data } = await axios.post(
        "http://localhost:3000/api/transaction",
        { ...formData },
        { headers: { "x-access-token": token } }
      );
      setFormData((prev) => ({ ...prev, receiver: "", amount: "", remarks: "" }));
      setSuccess("Transaction submitted successfully!");
      fetchTransactions(); // Refresh transactions after submission
    } catch (error) {
      setError(error.response?.data?.error || "Transaction failed");
    }
  };

  const exportToCSV = () => {
    const csv = transactions.map((t) => `${t.sender},${t.receiver},${t.amount},${t.paymentMethod},${t.timestamp},${t.isFraudulent}`).join("\n");
    const blob = new Blob([`Sender,Receiver,Amount,Payment Method,Timestamp,Is Fraudulent\n${csv}`], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions.csv";
    a.click();
  };

  const filteredTransactions = transactions.filter((t) =>
    filter === "all" || (filter === "fraud" && t.isFraudulent) || (filter === "legit" && !t.isFraudulent)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100">
      {error && <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white p-4 rounded-lg shadow-lg">{error}</div>}
      {success && <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white p-4 rounded-lg shadow-lg">{success}</div>}

      <nav className="bg-gradient-to-r from-indigo-700 to-purple-700 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-white font-extrabold text-2xl tracking-tight">FraudGuard</h1>
            <button
              onClick={() => setIsAdmin(!isAdmin)}
              className="px-4 py-2 bg-white text-indigo-700 rounded-full font-semibold hover:bg-indigo-100 transition duration-300"
            >
              {isAdmin ? "User Dashboard" : "Admin Panel"}
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {!isAdmin && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 mb-10 transform hover:scale-105 transition duration-300">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Initiate Transaction</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Your Bank</label>
                {!senderDetails ? (
                  <button
                    type="button"
                    onClick={() => open()}
                    disabled={!ready}
                    className="w-full p-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-lg font-semibold hover:from-yellow-500 hover:to-yellow-700 disabled:bg-gray-400 transition duration-300"
                  >
                    Link Your Bank Account
                  </button>
                ) : (
                  <input
                    value={`${senderDetails.name} - ${senderDetails.accountNumber}`}
                    disabled
                    className="w-full p-3 border rounded-lg bg-gray-100 text-gray-600"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Receiver Account</label>
                <input
                  name="receiver"
                  value={formData.receiver}
                  onChange={handleChange}
                  required
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter receiver's account number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount (₹)</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="UPI">UPI</option>
                  <option value="NEFT">NEFT</option>
                  <option value="CreditCard">Credit Card</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Remarks</label>
                <input
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={!senderDetails || senderDetails.error}
                  className="w-full p-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:bg-gray-400 transition duration-300"
                >
                  Submit
                </button>
              </div>
            </form>
            {senderDetails && !senderDetails.error && (
              <div className="mt-6 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg shadow-inner">
                <p className="text-gray-700"><strong>Your Name:</strong> {senderDetails.name || "N/A"}</p>
                <p className="text-gray-700"><strong>Your Account:</strong> {senderDetails.accountNumber || "N/A"}</p>
                <p className="text-gray-700"><strong>Your Routing:</strong> {senderDetails.routingNumber || "N/A"}</p>
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-purple-50">
            <h2 className="text-xl font-semibold text-gray-800">{isAdmin ? "Admin Control Center" : "Transaction History"}</h2>
            {isAdmin && (
              <div className="flex space-x-4">
                <select
                  onChange={(e) => setFilter(e.target.value)}
                  className="p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All</option>
                  <option value="fraud">Fraudulent</option>
                  <option value="legit">Legitimate</option>
                </select>
                <button
                  onClick={exportToCSV}
                  className="p-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg hover:from-green-600 hover:to-teal-600 transition duration-300"
                >
                  Export CSV
                </button>
              </div>
            )}
          </div>
          {isLoading ? (
            <div className="p-6 text-center text-gray-500">Loading...</div>
          ) : transactions.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No transactions found</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sender</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receiver</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((t) => (
                  <tr key={t._id || t.plaidTransactionId} className={t.isFraudulent ? "bg-red-50 hover:bg-red-100" : "hover:bg-gray-50"} transition duration-200>
                    <td className="px-6 py-4 text-sm text-gray-700">{t.sender}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{t.receiver}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">₹{Number(t.amount).toLocaleString("en-IN")}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{t.paymentMethod}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{new Date(t.timestamp).toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{t.isFraudulent ? "Fraudulent" : "Legitimate"}</td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => setSelectedTransaction(t)}
                        className="text-indigo-600 hover:text-indigo-900 font-medium transition duration-200"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {selectedTransaction && (
          <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center">
            <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl transform scale-100 transition duration-300">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Transaction Insights</h3>
              <div className="space-y-3 text-gray-700">
                <p><strong>Sender:</strong> {selectedTransaction.sender}</p>
                <p><strong>Receiver:</strong> {selectedTransaction.receiver}</p>
                <p><strong>Amount:</strong> ₹{Number(selectedTransaction.amount).toLocaleString("en-IN")}</p>
                <p><strong>Method:</strong> {selectedTransaction.paymentMethod}</p>
                <p><strong>Date:</strong> {new Date(selectedTransaction.timestamp).toLocaleString()}</p>
                <p><strong>Status:</strong> {selectedTransaction.isFraudulent ? "Fraudulent" : "Legitimate"}</p>
                <p><strong>Fraud Score:</strong> {selectedTransaction.fraudScore?.toFixed(2) || "N/A"}</p>
                <p><strong>Reasons:</strong> {selectedTransaction.fraudReasons || "N/A"}</p>
                <p><strong>Sender Name:</strong> {selectedTransaction.senderDetails.name}</p>
                <p><strong>Sender Account:</strong> {selectedTransaction.senderDetails.accountNumber}</p>
                <p><strong>Sender Routing:</strong> {selectedTransaction.senderDetails.routingNumber}</p>
                {selectedTransaction.plaidTransactionId && <p><strong>Plaid Transaction ID:</strong> {selectedTransaction.plaidTransactionId}</p>}
              </div>
              <button
                onClick={() => setSelectedTransaction(null)}
                className="mt-6 px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-700 text-white rounded-lg hover:from-gray-600 hover:to-gray-800 transition duration-300"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}