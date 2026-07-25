import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("letschat_user");
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("letschat_user", JSON.stringify(data));
    setUser(data);
    return data;
  };

  const register = async (name, email, password) => {
    const { data } = await api.post("/auth/register", {
      name,
      email,
      password,
    });
    localStorage.setItem("letschat_user", JSON.stringify(data));
    setUser(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("letschat_user");
    setUser(null);
  };

  // Used after profile/avatar/password updates to refresh local state + storage
  const updateUser = (patch) => {
    setUser((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem("letschat_user", JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, setUser: updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
