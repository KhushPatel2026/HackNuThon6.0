"use client";

import {
  Shield,
  BarChart3,
  Activity,
  AlertTriangle,
  Users,
  Settings,
  PieChart,
} from "lucide-react"; // Ensure lucide-react is installed and correctly imported
import { Link } from "react-router-dom"; // Replace Next.js Link with React Router Link

const SidebarItem = ({ icon, label, isActive = false, href, badge }) => {
  return (
    <Link
      to={href}
      className={`flex items-center gap-3 w-full p-2 rounded-md ${
        isActive
          ? "bg-[#4aff78]/10 text-[#4aff78]"
          : "hover:bg-[#4aff78]/5 text-gray-400 hover:text-white transition-colors"
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
      <div className="hidden md:block text-xs text-gray-400 mt-6 mb-2">
        {title}
      </div>
      <div className="space-y-1">{children}</div>
    </>
  );
};

export default function Sidebar({
  activePage = "dashboard",
  notificationCount = 0,
}) {
  return (
    <div className="fixed left-0 top-0 h-full w-16 md:w-64 bg-gradient-to-b from-[#1c1c1c] to-[#0a0a0a] border-r border-[#4aff78]/10 z-10">
      <div className="flex items-center gap-2 p-4 border-b border-[#4aff78]/10 h-16">
        <div className="w-8 h-8 bg-[#4aff78] rounded flex items-center justify-center">
          <Shield className="w-5 h-5 text-black" />
        </div>
        <span className="font-bold text-xl hidden md:block">SecureGuard</span>
      </div>

      <div className="p-4">
        <SidebarSection title="MAIN">
          <SidebarItem
            icon={<BarChart3 className="w-5 h-5" />}
            label="Dashboard"
            href="/user-dashboard"
            isActive={activePage === "dashboard"}
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
            label="Transactions"
            href="/audit-logs"
            isActive={activePage === "reports"}
          />
          <SidebarItem
            icon={<Shield className="w-5 h-5" />}
            label="AI Insights"
            href="/ai-insights"
            isActive={activePage === "ai-insights"}
          />
        </SidebarSection>
      </div>
    </div>
  );
}
