import { useState, useEffect } from "react";
import {
  Shield,
  Clock,
  User,
  Activity,
  ArrowLeft,
  Search,
  Filter,
  Download,
  RefreshCw,
  BarChart3,
  Users,
  PieChart,
  LogOut,
} from "lucide-react";
import { Button } from "../../Components/ui/button";
import { Input } from "../../Components/ui/input";
import { Link, useNavigate } from "react-router-dom";

const SidebarItem = ({ icon, label, isActive = false, href, badge }) => {
  return (
    <Link
      to={href}
      className={`flex items-center gap-3 w-full p-2 rounded-md ${
        isActive
          ? "bg-[#4aff78]/20 text-[#4aff78] shadow-[0_0_10px_rgba(74,255,120,0.2)]"
          : "hover:bg-[#4aff78]/10 text-gray-400 hover:text-white transition-colors"
      }`}
    >
      {icon}
      <span className="hidden md:block">{label}</span>
      {badge !== undefined && badge > 0 && (
        <div className="ml-auto bg-[#ff5555] text-white text-xs rounded-full w-5 h-5 items-center justify-center hidden md:flex">
          {badge}
        </div>
      )}
    </Link>
  );
};

const SidebarSection = ({ title, children }) => {
  return (
    <>
      <div className="hidden md:block text-xs text-gray-500 mt-6 mb-2 uppercase tracking-wider">
        {title}
      </div>
      <div className="space-y-1">{children}</div>
    </>
  );
};

const Sidebar = ({ activePage = "audit-logs", notificationCount = 0 }) => {
  return (
    <div className="fixed left-0 top-0 h-full w-16 md:w-64 bg-gradient-to-b from-[#1c1c1c] to-[#0a0a0a] border-r border-[#4aff78]/20 shadow-[0_0_15px_rgba(74,255,120,0.1)] z-20">
      <div className="flex items-center gap-2 p-4 border-b border-[#4aff78]/20 h-16">
        <div className="w-8 h-8 bg-[#4aff78] rounded flex items-center justify-center shadow-[0_0_10px_rgba(74,255,120,0.3)]">
          <Shield className="w-5 h-5 text-black" />
        </div>
        <span className="font-bold text-xl text-white hidden md:block">
          SecureGuard
        </span>
      </div>

      <div className="p-4">
        <SidebarSection title="MAIN">
          <SidebarItem
            icon={<BarChart3 className="w-5 h-5" />}
            label="Dashboard"
            href="/admin-dashboard"
            isActive={activePage === "admin-dashboard"}
          />
        </SidebarSection>

        <SidebarSection title="MANAGEMENT">
          <SidebarItem
            icon={<Users className="w-5 h-5" />}
            label="Users"
            href="/users"
            isActive={activePage === "users"}
          />
        </SidebarSection>

        <SidebarSection title="ANALYTICS">
          <SidebarItem
            icon={<PieChart className="w-5 h-5" />}
            label="Audit Logs"
            href="/audit-logs"
            isActive={activePage === "audit-logs"}
          />
          <SidebarItem
            icon={<LogOut className="w-5 h-5" />}
            label="Logout"
            href="/Logout"
            isActive={activePage === "ai-insights"}
          />
        </SidebarSection>
      </div>
    </div>
  );
};

function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch("http://localhost:3000/api/admin/audit-logs", {
        headers: { "x-access-token": token },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          navigate("/login");
          return;
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setLogs(data);
    } catch (err) {
      setError(err.message || "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(
    (log) =>
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (action) => {
    if (action.includes("login") || action.includes("create"))
      return "bg-[#4aff78]/20 text-[#4aff78]";
    if (action.includes("delete") || action.includes("fail"))
      return "bg-red-500/20 text-red-400";
    if (action.includes("update") || action.includes("modify"))
      return "bg-blue-500/20 text-blue-400";
    return "bg-gray-500/20 text-gray-400";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f1a12] to-[#0a120a] text-white overflow-hidden relative">
      <div className="absolute -z-10 w-full h-full bg-[#4aff78]/5 mix-blend-overlay"></div>

      <Sidebar activePage="audit-logs" />

      {/* Adjust main content to account for sidebar */}
      <div className="pl-16 md:pl-64">
        {/* Decorative elements */}
        <div className="absolute top-40 right-20 w-6 h-6 text-[#4aff78] animate-pulse">
          <Shield className="w-full h-full" />
        </div>
        <div className="absolute bottom-40 left-20 w-6 h-6 text-[#4aff78] animate-pulse delay-300">
          <Activity className="w-full h-full" />
        </div>

        {/* Navbar */}
        <header className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#4aff78] rounded flex items-center justify-center">
              <Shield className="w-5 h-5 text-black" />
            </div>
            <span className="font-bold text-xl">SecureGuard</span>
          </div>

          <Button
            variant="ghost"
            className="text-gray-300 hover:text-white hover:bg-[#4aff78]/10"
            onClick={() => navigate("/admin-dashboard")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div
            className={`transition-all duration-1000 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-12"
            }`}
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">Audit Logs</h1>
                <p className="text-gray-400">
                  Track all system activities and user actions
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="border-[#4aff78]/20 hover:border-[#4aff78]/40 text-white"
                  onClick={fetchLogs}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>

                <Button className="bg-[#4aff78] hover:bg-[#4aff78]/90 text-black">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            <div className="bg-gradient-to-tr from-[#1c1c1c] to-[#0a0a0a] rounded-xl border border-[#4aff78]/10 shadow-[0_0_20px_rgba(74,255,120,0.1)] p-6 mb-8">
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by action or user ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-[#0a0a0a] border-[#4aff78]/20 focus:border-[#4aff78]/40 rounded-lg"
                  />
                </div>

                <Button
                  variant="outline"
                  className="border-[#4aff78]/20 hover:border-[#4aff78]/40 text-white"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-20">
                  <div className="w-10 h-10 border-4 border-[#4aff78]/20 border-t-[#4aff78] rounded-full animate-spin"></div>
                </div>
              ) : error ? (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center text-red-400">
                  {error}
                  <Button
                    variant="link"
                    className="text-[#4aff78] ml-2"
                    onClick={fetchLogs}
                  >
                    Try Again
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#4aff78]/10 text-left">
                        <th className="py-3 px-4 text-gray-400 font-medium">
                          Action
                        </th>
                        <th className="py-3 px-4 text-gray-400 font-medium">
                          User ID
                        </th>
                        <th className="py-3 px-4 text-gray-400 font-medium">
                          Timestamp
                        </th>
                        <th className="py-3 px-4 text-gray-400 font-medium">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.length > 0 ? (
                        filteredLogs.map((log) => (
                          <tr
                            key={log._id}
                            className="border-b border-[#4aff78]/5 hover:bg-[#4aff78]/5 transition-colors"
                          >
                            <td className="py-4 px-4 font-medium">
                              {log.action}
                            </td>
                            <td className="py-4 px-4 text-gray-300">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-400" />
                                {log.userId}
                              </div>
                            </td>
                            <td className="py-4 px-4 text-gray-300">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-400" />
                                {new Date(log.timestamp).toLocaleString()}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                  log.action
                                )}`}
                              >
                                {log.status ||
                                  (log.action.includes("fail")
                                    ? "Failed"
                                    : "Success")}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={4}
                            className="py-20 text-center text-gray-400"
                          >
                            {searchTerm
                              ? "No logs match your search criteria"
                              : "No audit logs found"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-tr from-[#1c1c1c] to-[#0a0a0a] rounded-xl border border-[#4aff78]/10 p-6">
              <h2 className="text-xl font-bold mb-4">Activity Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#0a0a0a] rounded-lg p-4 border border-[#4aff78]/10">
                  <div className="text-sm text-gray-400 mb-1">
                    Total Activities
                  </div>
                  <div className="text-2xl font-bold">{logs.length}</div>
                </div>
                <div className="bg-[#0a0a0a] rounded-lg p-4 border border-[#4aff78]/10">
                  <div className="text-sm text-gray-400 mb-1">
                    Login Attempts
                  </div>
                  <div className="text-2xl font-bold">
                    {logs.filter((log) => log.action.includes("login")).length}
                  </div>
                </div>
                <div className="bg-[#0a0a0a] rounded-lg p-4 border border-[#4aff78]/10">
                  <div className="text-sm text-gray-400 mb-1">
                    Data Modifications
                  </div>
                  <div className="text-2xl font-bold">
                    {
                      logs.filter(
                        (log) =>
                          log.action.includes("update") ||
                          log.action.includes("create") ||
                          log.action.includes("delete")
                      ).length
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="container mx-auto px-4 py-8 border-t border-[#4aff78]/10 mt-12">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-[#4aff78] rounded flex items-center justify-center">
                <Shield className="w-4 h-4 text-black" />
              </div>
              <span className="font-bold">SecureGuard</span>
            </div>

            <div className="text-sm text-gray-400">
              © {new Date().getFullYear()} SecureGuard. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default AuditLogsPage;
