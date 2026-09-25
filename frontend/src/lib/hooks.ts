"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { notificationsApi } from "@/lib/api/notifications";

/** Thin wrapper so components can navigate without importing next/navigation directly */
export function useNavigate() {
  const router = useRouter();
  // Memoised on purpose: callers list `navigate` in useEffect dependency arrays,
  // and a new function each render made those effects re-run after every state
  // update — e.g. the student entry form re-called the server ~5 times a second.
  return useCallback((path: string, options?: { replace?: boolean }) => {
    if (options?.replace) {
      router.replace(path);
    } else {
      router.push(path);
    }
  }, [router]);
}

/** Extracts dynamic route params from the pathname */
export function useParams(): { id?: string } {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments[0] === "dashboard" && segments[1] === "exams" && segments[2]) {
    return { id: segments[2] };
  }
  if (segments[0] === "student" && segments[1] === "history" && segments[2]) {
    return { id: segments[2] };
  }
  return {};
}

/** Returns the auth token stored in localStorage (set by AuthModal after login) */
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
}

/** Saves the auth token to localStorage */
export function setAuthToken(token: string): void {
  localStorage.setItem("auth_token", token);
}

/** Removes the auth token from localStorage */
export function clearAuthToken(): void {
  localStorage.removeItem("auth_token");
}

/** Returns headers for authenticated API requests */
export function authHeaders(): HeadersInit {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/** Number of unread notifications for the logged-in teacher, for the header/sidebar bell badges */
export function useUnreadNotificationCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    notificationsApi
      .list("all")
      .then((notifs) => {
        if (!cancelled) setCount(notifs.filter((n) => !n.read).length);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return count;
}
