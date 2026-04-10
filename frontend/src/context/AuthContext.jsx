import { createContext, useContext, useEffect, useState } from "react";
import api from "../utils/api";

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

  const persistUser = (userData) => {
    if (!userData) {
      localStorage.removeItem("user");
      return;
    }

    localStorage.setItem("user", JSON.stringify(userData));
  };

  const applyUser = (userData) => {
    persistUser(userData);
    setUser(userData);
  };

  const clearSession = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const refreshUser = async () => {
    const response = await api.get("/auth/me");
    applyUser(response.data.data);
    return response.data.data;
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");

      if (!token) {
        setLoading(false);
        return;
      }

      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          clearSession();
          setLoading(false);
          return;
        }
      }

      try {
        await refreshUser();
      } catch {
        clearSession();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = (userData, token) => {
    localStorage.setItem("token", token);
    applyUser(userData);
  };

  const updateUser = (nextUser) => {
    setUser((currentUser) => {
      const resolvedUser =
        typeof nextUser === "function" ? nextUser(currentUser) : nextUser;
      persistUser(resolvedUser);
      return resolvedUser;
    });
  };

  const logout = () => {
    clearSession();
  };

  const value = {
    user,
    login,
    logout,
    updateUser,
    refreshUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
