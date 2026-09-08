export const getApiUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  if (typeof window !== "undefined" && envUrl.includes("localhost")) {
    return envUrl.replace("localhost", window.location.hostname);
  }
  return envUrl;
};

export const API_URL = getApiUrl();

async function tryRefreshStudentToken(): Promise<string | null> {
  const token = localStorage.getItem("student_token");
  if (!token) return null;
  try {
    const res = await fetch(`${API_URL}/student/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    localStorage.setItem("student_token", data.token);
    return data.token;
  } catch {
    return null;
  }
}

async function tryRefreshToken(): Promise<string | null> {
  const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null;
  if (!refreshToken) return null;
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": anonKey },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    localStorage.setItem("token", data.access_token);
    if (data.refresh_token) localStorage.setItem("refresh_token", data.refresh_token);
    return data.access_token;
  } catch {
    return null;
  }
}

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}, _retry = true): Promise<T> {
  let tokenKey = "token";
  let isStudentRoute = false;
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/student")) {
    tokenKey = "student_token";
    isStudentRoute = true;
  }
  const token = typeof window !== "undefined" ? localStorage.getItem(tokenKey) : null;
  
  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      // Try to refresh the token if this is a student route
      if (isStudentRoute && _retry) {
        const newToken = await tryRefreshStudentToken();
        if (newToken) {
          return fetchApi<T>(endpoint, options, false);
        }
      } else if (!isStudentRoute && _retry) {
        // Teacher refresh (existing)
        const newToken = await tryRefreshToken();
        if (newToken) {
          return fetchApi<T>(endpoint, options, false);
        }
      }
      localStorage.removeItem(tokenKey);
      if (!isStudentRoute) localStorage.removeItem("refresh_token");
      window.location.href = isStudentRoute ? "/student/enter" : "/";
    }
    
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { message: "An unexpected error occurred" };
    }
    throw new Error(errorData.message || errorData.error || response.statusText);
  }

  // Handle empty responses
  const text = await response.text();
  return text ? JSON.parse(text) : ({} as T);
}
