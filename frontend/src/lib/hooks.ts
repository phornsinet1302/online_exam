"use client";

import { useRouter, usePathname } from "next/navigation";

/** Thin wrapper so components can navigate without importing next/navigation directly */
export function useNavigate() {
  const router = useRouter();
  return (path: string) => router.push(path as never);
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
