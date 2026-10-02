import { useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { FiMenu, FiBell, FiLogOut, FiMoon, FiSun, FiChevronDown, FiUser } from "react-icons/fi";
import Sidebar from "../components/layout/Sidebar";
import { adminNav } from "../data/navigation";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-navy flex">
      <Sidebar
        items={adminNav}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        title="Admin Panel"
      />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 bg-white dark:bg-navy-light border-b border-slate-200 dark:border-slate-700 flex items-center gap-3 px-4 sm:px-6">
          <button
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <FiMenu size={20} />
          </button>
          <div>
            <h1 className="text-sm font-semibold text-navy dark:text-white">PTE Master Admin</h1>
            <p className="text-xs text-slate-400">Live platform data from the server</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Toggle theme"
            >
              {darkMode ? <FiSun size={18} /> : <FiMoon size={18} />}
            </button>
            <button className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Notifications">
              <FiBell size={18} />
            </button>
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <div className="w-8 h-8 rounded-full bg-navy text-white flex items-center justify-center text-sm font-semibold">
                  {user?.name?.charAt(0) || "A"}
                </div>
                <span className="hidden sm:block text-sm font-medium dark:text-white">{user?.name}</span>
                <FiChevronDown size={14} className="text-slate-400" />
              </button>
              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 card shadow-lg py-1 z-20">
                    <Link
                      to="/"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-300"
                    >
                      <FiUser size={16} /> View Site
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
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
