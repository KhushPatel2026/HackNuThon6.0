"use client";

import { useState, useEffect, useRef } from "react";
import { Pie } from "react-chartjs-2";
import { CSVLink } from "react-csv";
import Sidebar from "../../Components/Sidebar";
import {
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle,
  FileText,
  RefreshCw,
} from "lucide-react";
import "chart.js/auto";

export default function AdminDashboard() {
  const [transactions, setTransactions] = useState([]);
  const [fraudData, setFraudData] = useState({ fraud: 0, nonFraud: 0 });
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/admin/transactions", {
          headers: {
            "x-access-token": localStorage.getItem("token"),
          },
        });
        const data = await response.json();
        setTransactions(data);

        const fraudCount = data.filter((t) => t.isFraud).length;
        const nonFraudCount = data.length - fraudCount;
        setFraudData({ fraud: fraudCount, nonFraud: nonFraudCount });
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const data = {
      labels: transactions.map((t) => new Date(t.created_at).toLocaleTimeString()),
      values: transactions.map((t) => t.amount),
    };

    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(10, 10, 10, 0.8)";
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "rgba(74, 255, 120, 0.1)";
    ctx.lineWidth = 1;
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
      const y = padding + (chartHeight / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    const maxValue = Math.max(...data.values, 100) * 1.2;

    ctx.strokeStyle = "#4aff78";
    ctx.lineWidth = 2;
    ctx.shadowBlur = 8;
    ctx.shadowColor = "rgba(74, 255, 120, 0.4)";
    ctx.beginPath();

    data.values.forEach((value, index) => {
      const x = padding + (chartWidth / (data.values.length - 1)) * index;
      const y = height - padding - (value / maxValue) * chartHeight;
      index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
    gradient.addColorStop(0, "rgba(74, 255, 120, 0.2)");
    gradient.addColorStop(1, "rgba(74, 255, 120, 0)");
    ctx.fillStyle = gradient;
    ctx.shadowBlur = 0; // Reset shadow for fill
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    data.values.forEach((value, index) => {
      const x = padding + (chartWidth / (data.values.length - 1)) * index;
      const y = height - padding - (value / maxValue) * chartHeight;
      ctx.lineTo(x, y);
    });
    ctx.lineTo(width - padding, height - padding);
    ctx.closePath();
    ctx.fill();
  }, [transactions]);

  const pieChartData = {
    labels: ["Fraudulent", "Non-Fraudulent"],
    datasets: [
      {
        data: [fraudData.fraud, fraudData.nonFraud],
        backgroundColor: ["#ff5555", "#4aff78"],
        hoverBackgroundColor: ["#ff8888", "#8aff8a"],
        borderWidth: 0,
      },
    ],
  };

  const pieChartOptions = {
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "#ffffff",
          font: { size: 12 }, // Consistent with UserDashboard's default font size
        },
      },
    },
    animation: {
      duration: 1000,
      easing: "easeInOutQuad", // Smoother animation to match UserDashboard
    },
  };

  const csvHeaders = [
    { label: "Transaction ID", key: "transactionId" },
    { label: "Type", key: "type" },
    { label: "Amount", key: "amount" },
    { label: "Sender", key: "nameOrig" },
    { label: "Recipient", key: "nameDest" },
    { label: "Fraudulent", key: "isFraud" },
    { label: "Fraud Probability", key: "fraud_probability" },
    { label: "Compliance", key: "compliance" },
    { label: "Created At", key: "created_at" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f1a12] to-[#0a120a] text-white overflow-hidden relative">
      {/* Background consistent with UserDashboard */}
      <div className="absolute -z-10 w-full h-full bg-[#4aff78]/5 mix-blend-overlay"></div>

      <Sidebar activePage="dashboard" />

      <div className="flex-1 ml-64 p-6">
        {/* Header */}
        <header className="container mx-auto px-4 py-6 flex justify-between items-center border-b border-[#4aff78]/10 sticky top-0 bg-[#0a0a0a]/80 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#4aff78] rounded flex items-center justify-center">
              <Shield className="w-5 h-5 text-black" />
            </div>
            <span className="font-bold text-xl">Admin Dashboard</span>
          </div>
          <button
            className="w-8 h-8 rounded-full bg-[#0a0a0a] border border-[#4aff78]/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors hover:shadow-[0_0_10px_rgba(74,255,120,0.3)]"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </header>

        {/* Transaction Overview */}
        <div className="container mx-auto px-4 py-6">
          <h2 className="text-2xl font-bold mb-8">Transaction Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Transaction Volume */}
            <div className="md:col-span-2 bg-gradient-to-tr from-[#1c1c1c] to-[#0a0a0a] rounded-xl border border-[#4aff78]/10 p-6 transition-all duration-300 hover:shadow-[0_0_20px_rgba(74,255,120,0.1)]">
              <h3 className="text-xl font-bold mb-4 text-white">Transaction Volume</h3>
              <canvas ref={canvasRef} width={1000} height={400} className="w-full rounded-lg"></canvas>
            </div>
            {/* Fraud Distribution */}
            <div className="bg-gradient-to-tr from-[#1c1c1c] to-[#0a0a0a] rounded-xl border border-[#4aff78]/10 p-6 transition-all duration-300 hover:shadow-[0_0_20px_rgba(74,255,120,0.1)]">
              <h3 className="text-xl font-bold mb-4 text-white">Fraud Distribution</h3>
              <Pie data={pieChartData} options={pieChartOptions} />
            </div>
          </div>

          {/* Export Transactions */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Export Transactions</h2>
            <div className="bg-gradient-to-tr from-[#1c1c1c] to-[#0a0a0a] rounded-xl border border-[#4aff78]/10 p-6">
              <CSVLink
                data={transactions}
                headers={csvHeaders}
                filename="transactions.csv"
                className="group relative inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#4aff78] to-[#8aff8a] rounded-md text-black font-medium transition-all duration-300 hover:shadow-[0_0_20px_rgba(74,255,120,0.5)] overflow-hidden"
              >
                <FileText className="w-4 h-4 mr-2" />
                <span className="relative z-10">Export to CSV</span>
                <span className="absolute inset-0 bg-gradient-to-r from-[#8aff8a] to-[#4aff78] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              </CSVLink>
            </div>
          </div>

          {/* All Transactions */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">All Transactions</h2>
            <div className="bg-gradient-to-tr from-[#1c1c1c] to-[#0a0a0a] rounded-xl border border-[#4aff78]/10 p-6 overflow-x-auto">
              {loading ? (
                <p className="text-gray-400 text-center py-4">Loading transactions...</p>
              ) : (
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="border-b border-[#4aff78]/10">
                      <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Transaction ID</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Type</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Amount</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Sender</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Recipient</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Fraudulent</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Created At</th>
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
                        <td className="py-4 px-4">{transaction.transactionId.slice(0, 8)}</td>
                        <td className="py-4 px-4">{transaction.type}</td>
                        <td className="py-4 px-4 font-medium">₹{transaction.amount.toLocaleString()}</td>
                        <td className="py-4 px-4">{transaction.nameOrig}</td>
                        <td className="py-4 px-4">{transaction.nameDest}</td>
                        <td className="py-4 px-4">
                          <span className={transaction.isFraud ? "text-[#ff5555]" : "text-[#4aff78]"}>
                            {transaction.isFraud ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-gray-400">
                          {new Date(transaction.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* AI-Driven Insights */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4">AI-Driven Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: <Activity className="w-5 h-5" />,
                  title: "Pattern Recognition",
                  desc: `AI has detected unusual activity in ${transactions.filter((t) => t.type === "transfer").length} transfers today.`,
                  color: "from-[#4aff78]/10 to-[#8aff8a]/5",
                },
                {
                  icon: <AlertTriangle className="w-5 h-5" />,
                  title: "Risk Assessment",
                  desc: `${fraudData.fraud} transactions flagged requiring immediate review.`,
                  color: "from-[#ff5555]/10 to-[#ff8855]/5",
                },
                {
                  icon: <FileText className="w-5 h-5" />,
                  title: "Regulatory Updates",
                  desc: `${transactions.filter((t) => t.complianceIssue).length} transactions with compliance issues detected.`,
                  color: "from-[#ffaa55]/10 to-[#ffcc55]/5",
                },
              ].map((insight, index) => (
                <div
                  key={index}
                  className={`bg-gradient-to-tr from-[#1c1c1c] to-[#0a0a0a] rounded-xl border border-[#4aff78]/10 p-6 transition-all duration-300 hover:shadow-[0_0_20px_rgba(74,255,120,0.1)]`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-gray-400 text-sm mb-1">{insight.title}</div>
                      <div className="text-gray-400 text-sm">{insight.desc}</div>
                    </div>
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-tr ${insight.color} flex items-center justify-center`}>
                      {insight.icon}
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
    </div>
  );
}