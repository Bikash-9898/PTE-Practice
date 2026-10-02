import { useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import {
  FiMenu,
  FiBell,
  FiSearch,
  FiLogOut,
  FiUser,
  FiMoon,
  FiSun,
  FiChevronDown,
} from "react-icons/fi";
import Sidebar from "./Sidebar";
import { studentNav } from "../../data/navigation";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-surface dark:bg-navy flex">
      <Sidebar
        items={studentNav}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        title="PTE Master"
      />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-navy-light/90 backdrop-blur border-b border-slate-100 dark:border-slate-700 flex items-center gap-3 px-4 sm:px-6">
          <button
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <FiMenu size={20} />
          </button>

          <div className="flex-1 max-w-md relative hidden sm:block">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="search"
              placeholder="Search practice, tests..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && search.trim()) {
                  navigate(`/practice?q=${encodeURIComponent(search.trim())}`);
                }
              }}
              className="input pl-9 py-2 text-sm"
            />
          </div>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Toggle theme"
            >
              {darkMode ? <FiSun size={18} /> : <FiMoon size={18} />}
            </button>
            <button
              className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Notifications"
            >
              <FiBell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand rounded-full" />
            </button>

            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center text-sm font-semibold">
                  {user?.name?.charAt(0) || "U"}
                </div>
                <span className="hidden sm:block text-sm font-medium text-navy dark:text-white">
                  {user?.name?.split(" ")[0]}
                </span>
                <FiChevronDown size={14} className="text-slate-400 hidden sm:block" />
              </button>
              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 card shadow-lg py-1 z-20 animate-fade-in">
                    <Link
                      to="/dashboard/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <FiUser size={16} /> Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <FiLogOut size={16} /> Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
