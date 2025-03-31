import { useState, useEffect } from "react";
import {
  Shield,
  Users,
  Search,
  AlertTriangle,
  ArrowUpDown,
  Loader2,
  UserCheck,
  UserX,
} from "lucide-react";
import { Button } from "../../Components/ui/button";
import { Input } from "../../Components/ui/input";
import Sidebar from "../../Components/Sidebar"; // Adjust the import path if necessary

// Define user type based on the API response
const AdminUsersPage = () => {
  const [allUsers, setAllUsers] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"; // Ensure this matches your backend

  // Function to fetch user data
  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch(`${API_URL}/api/user`, {
        headers: { "x-access-token": token },
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Access denied: Admins only");
        }
        throw new Error("Failed to fetch user data");
      }

      const data = await response.json();
      if (data.status === "ok" && data.users) {
        setAllUsers(data.users);
        const decodedToken = JSON.parse(atob(token.split(".")[1]));
        setUser({
          ...data.users.find((u) => u._id === decodedToken.id),
          role: decodedToken.role,
        });
      } else {
        setUser(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load user data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  // Function to handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filter and sort users
  const filteredAndSortedUsers = allUsers
    .filter(
      (user) =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortField] || "";
      const bValue = b[sortField] || "";

      if (sortDirection === "asc") {
        return String(aValue).localeCompare(String(bValue));
      } else {
        return String(bValue).localeCompare(String(aValue));
      }
    });

  // Get user status color
  const getUserStatusColor = (status) => {
    switch (status) {
      case "active":
        return "text-[#4aff78]";
      case "inactive":
        return "text-yellow-500";
      case "suspended":
        return "text-red-500";
      default:
        return "text-[#4aff78]";
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar activePage="users" />
      <div className="flex-1 ml-16 md:ml-64 flex flex-col overflow-hidden">
        {/* Main content */}
        <div className="bg-gradient-to-br from-[#0a0a0a] via-[#0f1a12] to-[#0a120a] text-white relative flex flex-col h-full overflow-hidden">
          <div className="absolute inset-0 bg-[#4aff78]/5 mix-blend-overlay -z-10"></div>
          {/* Decorative elements */}
          <div className="absolute top-40 right-20 w-6 h-6 text-[#4aff78] animate-pulse">
            <Shield className="w-full h-full" />
          </div>
          <div className="absolute bottom-40 left-20 w-6 h-6 text-[#4aff78] animate-pulse delay-300">
            <Users className="w-full h-full" />
          </div>

          {/* Navbar */}
          <header className="py-4 px-6 border-b border-[#4aff78]/10 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#4aff78] rounded flex items-center justify-center">
                <Shield className="w-5 h-5 text-black" />
              </div>
              <span className="font-bold text-xl">SecureGuard</span>
            </div>
            {user && (
              <div className="flex items-center gap-2">
                <span className="text-gray-300">Welcome, {user.name}</span>
                <div className="px-2 py-1 bg-[#4aff78]/20 rounded-full text-xs text-[#4aff78] font-medium">
                  {user.role}
                </div>
              </div>
            )}
          </header>

          {/* Main Content - scrollable area */}
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto w-full">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                    <Users className="w-6 h-6 text-[#4aff78]" /> User Management
                  </h1>
                  <p className="text-gray-400">
                    Manage and monitor all user accounts
                  </p>
                </div>

                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-[#1c1c1c] border-[#4aff78]/20 focus:border-[#4aff78] focus:ring-[#4aff78]/20 rounded-lg w-full"
                  />
                </div>
              </div>

              {/* Error State */}
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <p className="text-red-200">{error}</p>
                </div>
              )}

              {/* Loading State */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-12 h-12 text-[#4aff78] animate-spin mb-4" />
                  <p className="text-gray-400">Loading user data...</p>
                </div>
              ) : (
                <>
                  {/* User Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-tr from-[#1c1c1c] to-[#0a0a0a] p-6 rounded-xl border border-[#4aff78]/10 shadow-[0_0_20px_rgba(74,255,120,0.05)]">
                      <div className="flex items-center justify-between">
                        <h3 className="text-gray-400">Total Users</h3>
                        <Users className="w-5 h-5 text-[#4aff78]" />
                      </div>
                      <p className="text-3xl font-bold mt-2">{allUsers.length}</p>
                    </div>

                    <div className="bg-gradient-to-tr from-[#1c1c1c] to-[#0a0a0a] p-6 rounded-xl border border-[#4aff78]/10 shadow-[0_0_20px_rgba(74,255,120,0.05)]">
                      <div className="flex items-center justify-between">
                        <h3 className="text-gray-400">Active Users</h3>
                        <UserCheck className="w-5 h-5 text-[#4aff78]" />
                      </div>
                      <p className="text-3xl font-bold mt-2">
                        {
                          allUsers.filter(
                            (user) => user.status === "active" || !user.status
                          ).length
                        }
                      </p>
                    </div>

                    <div className="bg-gradient-to-tr from-[#1c1c1c] to-[#0a0a0a] p-6 rounded-xl border border-[#4aff78]/10 shadow-[0_0_20px_rgba(74,255,120,0.05)]">
                      <div className="flex items-center justify-between">
                        <h3 className="text-gray-400">Inactive Users</h3>
                        <UserX className="w-5 h-5 text-yellow-500" />
                      </div>
                      <p className="text-3xl font-bold mt-2">
                        {
                          allUsers.filter(
                            (user) =>
                              user.status === "inactive" ||
                              user.status === "suspended"
                          ).length
                        }
                      </p>
                    </div>
                  </div>

                  {/* Users Table */}
                  <div className="bg-gradient-to-tr from-[#1c1c1c] to-[#0a0a0a] rounded-xl border border-[#4aff78]/20 shadow-[0_0_40px_rgba(74,255,120,0.1)] overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-[#4aff78]/10">
                            <th className="px-6 py-4 text-left">
                              <button
                                className="flex items-center gap-1 text-gray-300 hover:text-[#4aff78] transition-colors"
                                onClick={() => handleSort("name")}
                              >
                                Name
                                <ArrowUpDown className="w-4 h-4" />
                              </button>
                            </th>
                            <th className="px-6 py-4 text-left">
                              <button
                                className="flex items-center gap-1 text-gray-300 hover:text-[#4aff78] transition-colors"
                                onClick={() => handleSort("email")}
                              >
                                Email
                                <ArrowUpDown className="w-4 h-4" />
                              </button>
                            </th>
                            <th className="px-6 py-4 text-left">
                              <button
                                className="flex items-center gap-1 text-gray-300 hover:text-[#4aff78] transition-colors"
                                onClick={() => handleSort("role")}
                              >
                                Role
                                <ArrowUpDown className="w-4 h-4" />
                              </button>
                            </th>
                            <th className="px-6 py-4 text-left">Status</th>
                            <th className="px-6 py-4 text-left">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredAndSortedUsers.length > 0 ? (
                            filteredAndSortedUsers.map((user) => (
                              <tr
                                key={user._id}
                                className="border-b border-[#4aff78]/5 hover:bg-[#4aff78]/5 transition-colors"
                              >
                                <td className="px-6 py-4">{user.name}</td>
                                <td className="px-6 py-4">{user.email}</td>
                                <td className="px-6 py-4">
                                  <span className="px-2 py-1 bg-[#4aff78]/10 rounded-full text-xs font-medium">
                                    {user.role}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <span
                                    className={`flex items-center gap-1 ${getUserStatusColor(
                                      user.status
                                    )}`}
                                  >
                                    <span className="w-2 h-2 rounded-full bg-current"></span>
                                    {user.status || "Active"}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="border-[#4aff78]/20 hover:border-[#4aff78]/50 hover:bg-[#4aff78]/10 text-[#4aff78]"
                                    >
                                      Edit
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="border-red-500/20 hover:border-red-500/50 hover:bg-red-500/10 text-red-500"
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan={5}
                                className="px-6 py-12 text-center text-gray-400"
                              >
                                {searchTerm
                                  ? "No users match your search criteria"
                                  : "No users found"}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          </main>

          {/* Footer */}
          <footer className="shrink-0 py-4 px-6 border-t border-[#4aff78]/10">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center gap-2 mb-4 md:mb-0">
                <div className="w-8 h-8 bg-[#4aff78] rounded flex items-center justify-center">
                  <Shield className="w-5 h-5 text-black" />
                </div>
                <span className="font-bold text-xl">SecureGuard</span>
              </div>

              <div className="text-sm text-gray-400">
                © {new Date().getFullYear()} SecureGuard. All rights reserved.
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default AdminUsersPage;