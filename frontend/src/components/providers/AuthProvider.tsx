"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { authApi, User } from "@/lib/api/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User, refreshToken?: string) => void;
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
    // Supabase sends people back to the exact address the email link asked for
    // — but if that address isn't in its allowed redirect list it falls back to
    // the site's home page, with the sign-in tokens (or an error) in the URL
    // hash. The home page ignored them, so a freshly confirmed user looked
    // logged out. Hand those links to the callback page, which signs them in.
    if (window.location.pathname === "/" && /^#(.*&)?(access_token|error_code|error)=/.test(window.location.hash)) {
      const isRecovery = /[#&]type=recovery(&|$)/.test(window.location.hash);
      window.location.replace(`${isRecovery ? "/auth/reset-password" : "/auth/callback"}${window.location.hash}`);
      return;
    }

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

  const login = (token: string, userData: User, refreshToken?: string) => {
    localStorage.setItem("token", token);
    // Without this, a password login can't renew its ~1h access token and the
    // session dies mid-use (every dashboard call then fails "Authentication required").
    if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
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
