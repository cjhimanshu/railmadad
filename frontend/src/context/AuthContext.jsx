import { createContext, useState, useContext, useEffect } from "react";
import api from "../utils/api";
import { registerPush, unregisterPush } from "../utils/push";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (token && savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      // Re-register push in case subscription expired or device changed
      if (parsed.role !== "admin") {
        registerPush();
      }
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    // Subscribe to push after login (non-admin users only)
    if (userData.role !== "admin") {
      registerPush();
    }
  };

  const logout = () => {
    unregisterPush();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
