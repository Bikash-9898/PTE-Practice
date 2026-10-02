import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { FiMenu, FiX, FiMoon, FiSun, FiUser, FiLogOut } from "react-icons/fi";
import { publicNav } from "../../data/navigation";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import Button from "../common/Button";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
    setOpen(false);
  };

  const linkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors ${
      isActive
        ? "text-brand"
        : "text-slate-600 hover:text-navy dark:text-slate-300 dark:hover:text-white"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur-md dark:bg-navy/90 dark:border-slate-800">
      <div className="container-main px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white font-bold text-lg shadow-sm">
              P
            </div>
            <div>
              <span className="text-lg font-bold text-navy dark:text-white">PTE Master</span>
              <span className="hidden sm:block text-[10px] text-slate-400 -mt-0.5 leading-none">
                Practice Smart. Score Better.
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {publicNav.map((item) => (
              <NavLink key={item.path} to={item.path} className={linkClass} end={item.path === "/"}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <FiSun size={18} /> : <FiMoon size={18} />}
            </button>
            {isAuthenticated ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(user.role === "admin" ? "/admin" : "/dashboard")}
                >
                  <FiUser size={16} />
                  {user.name?.split(" ")[0]}
                </Button>
                <Button variant="secondary" size="sm" onClick={handleLogout}>
                  <FiLogOut size={14} />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
                  Login
                </Button>
                <Button size="sm" onClick={() => navigate("/register")}>
                  Get Started
                </Button>
              </>
            )}
          </div>

          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 text-slate-500"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <FiSun size={18} /> : <FiMoon size={18} />}
            </button>
            <button
              className="rounded-lg p-2 text-navy dark:text-white"
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
            >
              {open ? <FiX size={22} /> : <FiMenu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-slate-100 bg-white dark:bg-navy dark:border-slate-800 animate-fade-in">
          <div className="px-4 py-4 space-y-1">
            {publicNav.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-2.5 text-sm font-medium ${
                    isActive
                      ? "bg-blue-50 text-brand dark:bg-blue-900/30"
                      : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-700 space-y-2">
              {isAuthenticated ? (
                <>
                  <Button
                    className="w-full"
                    onClick={() => {
                      navigate(user.role === "admin" ? "/admin" : "/dashboard");
                      setOpen(false);
                    }}
                  >
                    Go to Dashboard
                  </Button>
                  <Button variant="secondary" className="w-full" onClick={handleLogout}>
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => {
                      navigate("/login");
                      setOpen(false);
                    }}
                  >
                    Login
                  </Button>
                  <Button
                    className="w-full"
                    onClick={() => {
                      navigate("/register");
                      setOpen(false);
                    }}
                  >
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
