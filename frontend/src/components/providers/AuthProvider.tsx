"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { authApi, User } from "@/lib/api/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (patch: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    // Try to restore session using stored access token
    authApi.getMe()
      .then((userData) => {
        setUser(userData);
        setLoading(false);
      })
      .catch(async () => {
        // Access token expired — try to silently refresh using the refresh token
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) {
          localStorage.removeItem("token");
          setUser(null);
          setLoading(false);
          return;
        }

        try {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jfebblgfihkhuaewxnjs.supabase.co";
          const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

          const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "apikey": anonKey },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });

          if (!res.ok) throw new Error("Refresh failed");

          const data = await res.json();
          const newAccessToken = data.access_token;
          const newRefreshToken = data.refresh_token;

          // Persist the new tokens
          localStorage.setItem("token", newAccessToken);
          if (newRefreshToken) localStorage.setItem("refresh_token", newRefreshToken);

          // Now fetch the user with the fresh token
          const userData = await authApi.getMe();
          setUser(userData);
        } catch {
          // Refresh also failed — clear everything and let user log in again
          localStorage.removeItem("token");
          localStorage.removeItem("refresh_token");
          setUser(null);
        } finally {
          setLoading(false);
        }
      });
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem("token", token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    setUser(null);
    window.location.href = "/";
  };

  const updateUser = (patch: Partial<User>) => {
    setUser(prev => (prev ? { ...prev, ...patch } : prev));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
