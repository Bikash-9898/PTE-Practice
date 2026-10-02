import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext(null);

const STORAGE_KEY = "pte_master_auth";
const USERS_KEY = "pte_master_users";

const defaultUsers = [
  {
    id: "student-1",
    name: "Alex Johnson",
    email: "student@ptemaster.com",
    password: "student123",
    role: "student",
    avatar: null,
    streak: 7,
    totalPractice: 48,
    createdAt: "2025-06-15",
  },
];

function loadUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) {
      const users = JSON.parse(raw).filter((user) => user.role !== "admin");
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      return users;
    }
  } catch {
    /* ignore */
  }
  localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
  return defaultUsers;
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const raw = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    let savedUser = null;
    try {
      savedUser = raw ? JSON.parse(raw) : null;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
    }

    fetch("/api/auth/me", { credentials: "include" })
      .then(async (response) => {
        if (response.ok) {
          const payload = await response.json();
          return payload?.data?.user || null;
        }
        if (response.status === 401 || response.status === 403) return false;
        throw new Error("Auth service unavailable");
      })
      .then((serverUser) => {
        if (!active) return;
        if (serverUser) {
          const session = {
            id: serverUser.id,
            name: serverUser.name,
            email: serverUser.email,
            role: serverUser.role,
            avatar: serverUser.avatar || serverUser.profileImage || null,
            streak: serverUser.streak || 0,
            totalPractice: serverUser.practiceStats?.total || 0,
          };
          setUser(session);
        } else if (serverUser === false) {
          localStorage.removeItem(STORAGE_KEY);
          sessionStorage.removeItem(STORAGE_KEY);
          setUser(null);
        } else {
          setUser(savedUser);
        }
        setLoading(false);
      })
      .catch(() => {
        if (active) {
          setUser(savedUser);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email, password, remember = true) => {
    let serverUser = null;
    let serverUnavailable = false;
    let serverResponse;
    try {
      serverResponse = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, remember }),
      });
    } catch {
      serverUnavailable = true;
    }

    if (!serverUnavailable) {
      const payload = await serverResponse.json();
      if (!serverResponse.ok) {
        throw new Error(payload.message || "Invalid email or password");
      }
      serverUser = payload?.data?.user;
      if (!serverUser) {
        throw new Error("The server did not return a valid user session");
      }
    }

    if (serverUser) {
      const session = {
        id: serverUser.id,
        name: serverUser.name,
        email: serverUser.email,
        role: serverUser.role,
        avatar: serverUser.avatar || serverUser.profileImage || null,
        streak: serverUser.streak || 0,
        totalPractice: serverUser.practiceStats?.total || 0,
      };
      setUser(session);
      if (remember) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      else sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      return session;
    }

    // Server login failed or is unavailable — try the local demo accounts.
    await new Promise((r) => setTimeout(r, 300));
    const users = loadUsers();
    const found = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!found) {
      throw new Error("Invalid email or password. Try student@ptemaster.com / student123");
    }
    const session = {
      id: found.id,
      name: found.name,
      email: found.email,
      role: found.role,
      avatar: found.avatar,
      streak: found.streak || 0,
      totalPractice: found.totalPractice || 0,
    };
    setUser(session);
    if (remember) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    }
    return session;
  }, []);

  const register = useCallback(async ({ name, email, password }) => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message || "Registration failed");
    const registeredUser = payload?.data?.user;
    if (!registeredUser) throw new Error("Registration returned no user session");
    setUser({
      id: registeredUser.id,
      name: registeredUser.name,
      email: registeredUser.email,
      role: registeredUser.role,
      avatar: registeredUser.avatar || registeredUser.profileImage || null,
      streak: registeredUser.streak || 0,
      totalPractice: registeredUser.practiceStats?.total || 0,
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      id: registeredUser.id,
      name: registeredUser.name,
      email: registeredUser.email,
      role: registeredUser.role,
      avatar: registeredUser.avatar || registeredUser.profileImage || null,
      streak: registeredUser.streak || 0,
      totalPractice: registeredUser.practiceStats?.total || 0,
    }));
    return registeredUser;
  }, []);

  const logout = useCallback(() => {
    fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  const updateProfile = useCallback((updates) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      const users = loadUsers();
      const idx = users.findIndex((u) => u.id === prev.id);
      if (idx >= 0) {
        users[idx] = { ...users[idx], ...updates };
        saveUsers(users);
      }
      return next;
    });
  }, []);

  const resetPasswordRequest = useCallback(async (email) => {
    await new Promise((r) => setTimeout(r, 800));
    const users = loadUsers();
    const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!found) throw new Error("No account found with that email address.");
    return true;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin",
        isStudent: user?.role === "student",
        login,
        register,
        logout,
        updateProfile,
        resetPasswordRequest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}