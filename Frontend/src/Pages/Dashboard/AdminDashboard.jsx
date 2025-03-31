"use client";

import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import {
  ArrowRight,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  Bell,
  Search,
  Calendar,
  ChevronDown,
  Zap,
  FileText,
  ExternalLink,
  RefreshCw,
  Maximize2,
} from "lucide-react";
import Sidebar from "../../Components/Sidebar";

export default function AdminDashboard() {
  const [isVisible, setIsVisible] = useState(false);
  const [liveUpdates, setLiveUpdates] = useState(true);
  const [timeRange, setTimeRange] = useState("24h");
  const [showTimeRangeMenu, setShowTimeRangeMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [transactions, setTransactions] = useState([]);
  const [flaggedCount, setFlaggedCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const canvasRef = useRef(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const socket = io("http://localhost:3000");

    socket.on("connect", () => {
      console.log("Connected to WebSocket server:", socket.id);
    });

    socket.on("transactionUpdate", (newTransaction) => {
      setTransactions((prev) => {
        const updated = [newTransaction, ...prev].slice(0, 100); // Keep last 100 transactions
        setFlaggedCount(updated.filter(t => t.status === "flagged").length);
        setNotificationCount(prev => newTransaction.status === "flagged" ? prev + 1 : prev);
        return updated;
      });
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from WebSocket server");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const timeRanges = {
      "1h": 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000
    };
    
    const filteredTransactions = transactions.filter(t => 
      Date.now() - new Date(t.timestamp).getTime() <= timeRanges[timeRange]
    );

    const data = {
      labels: filteredTransactions.map(t => new Date(t.timestamp).toLocaleTimeString()),
      values: filteredTransactions.map(t => t.amount),
      flagged: filteredTransactions
        .map((t, i) => t.status === "flagged" ? { index: i, value: t.amount } : null)
        .filter(Boolean)
    };

    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(10, 10, 10, 0.3)";
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

    ctx.strokeStyle = "rgba(74, 255, 120, 0.8)";
    ctx.lineWidth = 2;
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

    ctx.fillStyle = "#ff5555";
    data.flagged.forEach(({ index, value }) => {
      const x = padding + (chartWidth / (data.values.length - 1)) * index;
      const y = height - padding - (value / maxValue) * chartHeight;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ff5555";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.stroke();
    });

    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    const labelStep = Math.ceil(data.labels.length / 6);
    for (let i = 0; i < data.labels.length; i += labelStep) {
      const x = padding + (chartWidth / (data.labels.length - 1)) * i;
      ctx.fillText(data.labels[i], x, height - padding + 15);
    }

    ctx.textAlign = "right";
    for (let i = 0; i <= gridLines; i++) {
      const y = padding + (chartHeight / gridLines) * i;
      const value = Math.round(maxValue - (maxValue / gridLines) * i);
      ctx.fillText(value.toString(), padding - 10, y + 3);
    }
  }, [transactions, timeRange]);

  const summaryData = [
    {
      title: "Total Transactions",
      value: transactions.length.toString(),
      suffix: "today",
      icon: <Activity className="w-5 h-5" />,
      color: "from-[#4aff78]/10 to-[#8aff8a]/5",
      change: "+12.5%",
      changeType: "positive",
    },
    {
      title: "Flagged Transactions",
      value: flaggedCount.toString(),
      suffix: `${((flaggedCount / Math.max(transactions.length, 1)) * 100).toFixed(1)}% of total`,
      icon: <AlertTriangle className="w-5 h-5" />,
      color: "from-[#ff5555]/10 to-[#ff8855]/5",
      change: "+3.2%",
      changeType: "negative",
      notification: notificationCount,
    },
    {
      title: "False Positives",
      value: transactions.filter(t => t.status === "safe" && t.wasFlagged).length.toString(),
      suffix: "resolved as safe",
      icon: <CheckCircle className="w-5 h-5" />,
      color: "from-[#4aff78]/10 to-[#8aff8a]/5",
      change: "-5.1%",
      changeType: "positive",
    },
    {
      title: "Compliance Alerts",
      value: transactions.filter(t => t.complianceIssue).length.toString(),
      suffix: "regulation violation",
      icon: <FileText className="w-5 h-5" />,
      color: "from-[#ffaa55]/10 to-[#ffcc55]/5",
      change: "0%",
      changeType: "neutral",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f1a12] to-[#0a120a] text-white overflow-hidden relative">
      <div className="absolute -z-10 w-full h-full bg-[#4aff78]/5 mix-blend-overlay"></div>

      <Sidebar activePage="dashboard" notificationCount={notificationCount} />

      <div className="ml-16 md:ml-64">
        <header className="h-16 border-b border-[#4aff78]/10 flex items-center justify-between px-4 sticky top-0 bg-[#0a0a0a]/80 backdrop-blur-sm z-10">
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button className="w-8 h-8 rounded-full bg-[#1c1c1c] flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                <Bell className="w-4 h-4" />
              </button>
              {notificationCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-[#ff5555] text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {notificationCount}
                </div>
              )}
            </div>
            <div className="h-8 w-[1px] bg-[#4aff78]/10"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#4aff78] to-[#8aff8a] flex items-center justify-center text-black font-bold">
                A
              </div>
              <div className="hidden md:block">
                <div className="text-sm font-medium">Admin User</div>
                <div className="text-xs text-gray-400">Administrator</div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6">
          <div className={`flex flex-wrap gap-3 mb-6 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
            <button className="group relative px-4 py-2 bg-gradient-to-r from-[#4aff78] to-[#8aff8a] rounded-md text-black font-medium transition-all duration-300 hover:shadow-[0_0_20px_rgba(74,255,120,0.5)] overflow-hidden">
              <span className="relative z-10 flex items-center gap-2">
                <Activity className="w-4 h-4" /> Transaction Monitor
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-[#8aff8a] to-[#4aff78] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            </button>
            <button className="group relative px-4 py-2 bg-[#1c1c1c] border border-[#4aff78]/20 rounded-md font-medium transition-all duration-300 hover:border-[#4aff78]/40 hover:bg-[#4aff78]/5 overflow-hidden">
              <span className="relative z-10 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Alerts
                {notificationCount > 0 && (
                  <div className="bg-[#ff5555] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {notificationCount}
                  </div>
                )}
              </span>
            </button>
            <button className="group relative px-4 py-2 bg-[#1c1c1c] border border-[#4aff78]/20 rounded-md font-medium transition-all duration-300 hover:border-[#4aff78]/40 hover:bg-[#4aff78]/5 overflow-hidden">
              <span className="relative z-10 flex items-center gap-2">
                <Settings className="w-4 h-4" /> Settings
              </span>
            </button>
            <div className="ml-auto flex items-center gap-2 bg-[#1c1c1c] rounded-md px-3 py-2 border border-[#4aff78]/10">
              <div className={`w-2 h-2 rounded-full ${liveUpdates ? "bg-[#4aff78] animate-pulse" : "bg-gray-500"}`}></div>
              <span className="text-sm">Live Updates</span>
              <button
                className={`w-10 h-5 rounded-full relative ${liveUpdates ? "bg-[#4aff78]/30" : "bg-gray-700"} transition-colors duration-300`}
                onClick={() => setLiveUpdates(!liveUpdates)}
              >
                <span className={`absolute top-0.5 ${liveUpdates ? "right-0.5" : "left-0.5"} w-4 h-4 rounded-full bg-white transition-all duration-300`}></span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {summaryData.map((card, index) => (
              <div
                key={index}
                className={`bg-gradient-to-tr from-[#1c1c1c] to-[#0a0a0a] rounded-xl border border-[#4aff78]/10 p-4 transition-all duration-300 hover:shadow-[0_0_20px_rgba(74,255,120,0.1)] ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-gray-400 text-sm mb-1">{card.title}</div>
                    <div className="flex items-end gap-1">
                      <div className="text-2xl font-bold relative">
                        {card.value}
                        {card.notification && (
                          <div className="absolute -top-2 -right-2 bg-[#ff5555] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                            {card.notification}
                          </div>
                        )}
                      </div>
                      <div className="text-gray-400 text-xs mb-1">{card.suffix}</div>
                    </div>
                    <div className={`text-xs flex items-center gap-1 mt-1 ${card.changeType === "positive" ? "text-[#4aff78]" : card.changeType === "negative" ? "text-[#ff5555]" : "text-gray-400"}`}>
                      {card.changeType === "positive" ? "↑" : card.changeType === "negative" ? "↓" : "–"} {card.change} from yesterday
                    </div>
                  </div>
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-tr ${card.color} flex items-center justify-center`}>
                    {card.icon}
                  </div>
                </div>
                <div className="mt-4 h-1 w-full bg-[#1c1c1c] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${card.changeType === "positive" ? "bg-gradient-to-r from-[#4aff78] to-[#8aff8a]" : card.changeType === "negative" ? "bg-gradient-to-r from-[#ff5555] to-[#ff8855]" : "bg-gradient-to-r from-[#ffaa55] to-[#ffcc55]"}`}
                    style={{ width: `${Math.min(Number.parseInt(card.value.replace(/,/g, "")) / 20, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className={`bg-gradient-to-tr from-[#1c1c1c] to-[#0a0a0a] rounded-xl border border-[#4aff78]/10 p-4 mb-6 transition-all duration-1000 delay-300 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
              <div>
                <h2 className="text-lg font-bold">Transaction Volume</h2>
                <p className="text-sm text-gray-400">Real-time monitoring of transaction activity</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <button
                    className="flex items-center gap-2 bg-[#0a0a0a] border border-[#4aff78]/10 rounded-md py-2 px-3 text-sm"
                    onClick={() => setShowTimeRangeMenu(!showTimeRangeMenu)}
                  >
                    <Clock className="w-4 h-4" />
                    <span>{timeRange === "1h" ? "Last Hour" : timeRange === "24h" ? "Last 24 Hours" : "Last 7 Days"}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {showTimeRangeMenu && (
                    <div className="absolute right-0 mt-2 w-40 bg-[#1c1c1c] border border-[#4aff78]/10 rounded-md shadow-lg z-10">
                      <div className="py-1">
                        {[{ value: "1h", label: "Last Hour" }, { value: "24h", label: "Last 24 Hours" }, { value: "7d", label: "Last 7 Days" }].map((option) => (
                          <button
                            key={option.value}
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-[#4aff78]/10 transition-colors"
                            onClick={() => {
                              setTimeRange(option.value);
                              setShowTimeRangeMenu(false);
                            }}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <button className="flex items-center justify-center w-8 h-8 rounded-md bg-[#0a0a0a] border border-[#4aff78]/10 text-gray-400 hover:text-white transition-colors">
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button className="flex items-center justify-center w-8 h-8 rounded-md bg-[#0a0a0a] border border-[#4aff78]/10 text-gray-400 hover:text-white transition-colors">
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="relative h-64 md:h-80">
              <canvas ref={canvasRef} width={1000} height={400} className="w-full h-full rounded-lg"></canvas>
              <div className="absolute bottom-4 left-4 flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-[#4aff78]"></div>
                  <span className="text-xs text-gray-400">Transactions</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-[#ff5555]"></div>
                  <span className="text-xs text-gray-400">Flagged</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={`bg-gradient-to-tr from-[#1c1c1c] to-[#0a0a0a] rounded-xl border border-[#4aff78]/10 p-4 transition-all duration-1000 delay-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
              <h2 className="text-lg font-bold mb-4">Filters</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Transaction Type</label>
                  <div className="relative">
                    <button
                      className="flex items-center justify-between w-full bg-[#0a0a0a] border border-[#4aff78]/10 rounded-md py-2 px-3 text-sm"
                      onClick={() => setShowTypeMenu(!showTypeMenu)}
                    >
                      <span>{typeFilter === "all" ? "All Types" : typeFilter === "transfer" ? "Transfers" : typeFilter === "withdrawal" ? "Withdrawals" : typeFilter === "deposit" ? "Deposits" : "Payments"}</span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    {showTypeMenu && (
                      <div className="absolute left-0 right-0 mt-2 bg-[#1c1c1c] border border-[#4aff78]/10 rounded-md shadow-lg z-10">
                        <div className="py-1">
                          {["all", "transfer", "withdrawal", "deposit", "payment"].map((type) => (
                            <button
                              key={type}
                              className="block w-full text-left px-4 py-2 text-sm hover:bg-[#4aff78]/10 transition-colors"
                              onClick={() => {
                                setTypeFilter(type);
                                setShowTypeMenu(false);
                              }}
                            >
                              {type === "all" ? "All Types" : type === "transfer" ? "Transfers" : type === "withdrawal" ? "Withdrawals" : type === "deposit" ? "Deposits" : "Payments"}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Status</label>
                  <div className="relative">
                    <button
                      className="flex items-center justify-between w-full bg-[#0a0a0a] border border-[#4aff78]/10 rounded-md py-2 px-3 text-sm"
                      onClick={() => setShowStatusMenu(!showStatusMenu)}
                    >
                      <span>{statusFilter === "all" ? "All Statuses" : statusFilter === "flagged" ? "Flagged" : statusFilter === "safe" ? "Safe" : "Pending"}</span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    {showStatusMenu && (
                      <div className="absolute left-0 right-0 mt-2 bg-[#1c1c1c] border border-[#4aff78]/10 rounded-md shadow-lg z-10">
                        <div className="py-1">
                          {["all", "flagged", "safe", "pending"].map((status) => (
                            <button
                              key={status}
                              className="block w-full text-left px-4 py-2 text-sm hover:bg-[#4aff78]/10 transition-colors"
                              onClick={() => {
                                setStatusFilter(status);
                                setShowStatusMenu(false);
                              }}
                            >
                              {status === "all" ? "All Statuses" : status === "flagged" ? "Flagged" : status === "safe" ? "Safe" : "Pending"}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Date Range</label>
                  <div className="relative">
                    <div className="flex items-center w-full bg-[#0a0a0a] border border-[#4aff78]/10 rounded-md py-2 px-3 text-sm">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      <input type="text" placeholder="Select date range" className="bg-transparent w-full focus:outline-none" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Search</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <Search className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      placeholder="Transaction ID or Account"
                      className="w-full bg-[#0a0a0a] border border-[#4aff78]/10 rounded-md py-2 pl-10 pr-3 text-sm focus:outline-none focus:border-[#4aff78]/30"
                    />
                  </div>
                </div>
                <button className="w-full py-2 bg-gradient-to-r from-[#4aff78] to-[#8aff8a] rounded-md text-black font-medium transition-all duration-300 hover:shadow-[0_0_20px_rgba(74,255,120,0.5)]">
                  Apply Filters
                </button>
              </div>
            </div>

            <div className={`bg-gradient-to-tr from-[#1c1c1c] to-[#0a0a0a] rounded-xl border border-[#4aff78]/10 p-4 transition-all duration-1000 delay-600 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
              <h2 className="text-lg font-bold mb-4">Recent Transactions</h2>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {transactions.slice(0, 10).map((t, index) => (
                  <div key={index} className={`bg-[#0a0a0a] p-3 rounded-lg border-l-2 ${t.status === "flagged" ? "border-[#ff5555]" : "border-[#4aff78]"}`}>
                    <div className="flex justify-between items-start">
                      <div className="font-medium">{t.type} #{t.id}</div>
                      <div className="text-xs text-gray-400">{new Date(t.timestamp).toLocaleTimeString()}</div>
                    </div>
                    <div className="text-sm text-gray-400 mt-1">₹{t.amount.toLocaleString()} • {t.account}</div>
                    <div className="flex justify-between items-center mt-2">
                      <div className={`text-xs ${t.status === "flagged" ? "bg-[#ff5555]/10 text-[#ff5555]" : "bg-[#4aff78]/10 text-[#4aff78]"} px-2 py-0.5 rounded`}>
                        {t.status}
                      </div>
                      <button className="text-xs text-[#4aff78]">Details</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`bg-gradient-to-tr from-[#1c1c1c] to-[#0a0a0a] rounded-xl border border-[#4aff78]/10 p-4 transition-all duration-1000 delay-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Recent Alerts</h2>
                <button className="text-[#4aff78] hover:text-[#8aff8a] transition-colors text-sm flex items-center gap-1">
                  View All <ExternalLink className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-3">
                {transactions.filter(t => t.status === "flagged").slice(0, 4).map((t, index) => (
                  <div key={index} className="bg-[#0a0a0a] p-3 rounded-lg border-l-2 border-[#ff5555]">
                    <div className="flex justify-between items-start">
                      <div className="font-medium">{t.type} Alert</div>
                      <div className="text-xs text-gray-400">{new Date(t.timestamp).toLocaleTimeString()}</div>
                    </div>
                    <div className="text-sm text-gray-400 mt-1">Transaction of ₹{t.amount.toLocaleString()} flagged</div>
                    <div className="flex justify-between items-center mt-2">
                      <div className="text-xs bg-[#ff5555]/10 text-[#ff5555] px-2 py-0.5 rounded">High Risk</div>
                      <button className="text-xs text-[#4aff78]">Review</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={`mt-6 bg-gradient-to-tr from-[#1c1c1c] to-[#0a0a0a] rounded-xl border border-[#4aff78]/10 p-4 transition-all duration-1000 delay-800 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
            <h2 className="text-lg font-bold mb-4">AI-Driven Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#0a0a0a] p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#4aff78]/10 flex items-center justify-center text-[#4aff78] shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-medium">Pattern Recognition</div>
                    <div className="text-sm text-gray-400 mt-1">
                      AI has detected unusual activity in {transactions.filter(t => t.type === "transfer").length} transfers today.
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-[#0a0a0a] p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#4aff78]/10 flex items-center justify-center text-[#4aff78] shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-medium">Risk Assessment</div>
                    <div className="text-sm text-gray-400 mt-1">
                      {flaggedCount} transactions flagged requiring immediate review.
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-[#0a0a0a] p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#4aff78]/10 flex items-center justify-center text-[#4aff78] shrink-0">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-medium">Performance Optimization</div>
                    <div className="text-sm text-gray-400 mt-1">
                      Real-time processing handling {transactions.length} transactions today.
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-[#0a0a0a] p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#4aff78]/10 flex items-center justify-center text-[#4aff78] shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-medium">Regulatory Updates</div>
                    <div className="text-sm text-gray-400 mt-1">
                      {transactions.filter(t => t.complianceIssue).length} transactions with compliance issues detected.
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <button className="mt-4 flex items-center gap-1 text-[#4aff78] hover:text-[#8aff8a] transition-colors text-sm">
              View Detailed Analysis <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <footer className="px-4 py-6 border-t border-[#4aff78]/10 mt-6">
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

      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-4 right-4 bg-[#4aff78] text-black p-3 rounded-full shadow-lg hover:bg-[#8aff8a] transition-all"
        >
          ↑
        </button>
      )}
    </div>
  );
}